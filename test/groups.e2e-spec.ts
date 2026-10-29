import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('MVP group workflow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const emails = [
    `mvp-owner-${randomUUID()}@example.com`,
    `mvp-member-a-${randomUUID()}@example.com`,
    `mvp-member-b-${randomUUID()}@example.com`,
  ];

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL must point to a local test database');
    }

    const { hostname } = new URL(databaseUrl);
    if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)) {
      throw new Error(
        'E2E tests are restricted to a local PostgreSQL database',
      );
    }

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.group.deleteMany({
        where: { createdBy: { email: { in: emails } } },
      });
      await prisma.user.deleteMany({ where: { email: { in: emails } } });
    }
    await app?.close();
  });

  it('registers users, manages a group, splits expenses, calculates balances and preserves history on removal', async () => {
    const users: { id: string; name: string; email: string }[] = [];
    const tokens: string[] = [];

    for (let index = 0; index < emails.length; index += 1) {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: `MVP User ${index}`,
          email: emails[index],
          password: 'MvpPassword123!',
        })
        .expect(201);
      users.push(response.body.user);
      tokens.push(response.body.accessToken);
    }

    const groupResponse = await request(app.getHttpServer())
      .post('/api/groups')
      .set('Authorization', `Bearer ${tokens[0]}`)
      .send({ name: 'MVP Test Group' })
      .expect(201);
    const groupId = groupResponse.body.id as string;

    for (const email of emails.slice(1)) {
      await request(app.getHttpServer())
        .post(`/api/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({ email })
        .expect(201);
    }

    await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/expenses`)
      .set('Authorization', `Bearer ${tokens[0]}`)
      .send({ description: 'MVP dinner', amountCents: 901 })
      .expect(201);

    const balancesResponse = await request(app.getHttpServer())
      .get(`/api/groups/${groupId}/balances`)
      .set('Authorization', `Bearer ${tokens[0]}`)
      .expect(200);
    expect(
      balancesResponse.body.balances.reduce(
        (total: number, balance: { balanceCents: number }) =>
          total + balance.balanceCents,
        0,
      ),
    ).toBe(0);
    expect(balancesResponse.body.balances).toHaveLength(3);

    const settlementsResponse = await request(app.getHttpServer())
      .get(`/api/groups/${groupId}/settlements`)
      .set('Authorization', `Bearer ${tokens[0]}`)
      .expect(200);
    expect(settlementsResponse.body.transfers).toHaveLength(2);

    await request(app.getHttpServer())
      .delete(`/api/groups/${groupId}/members/${users[1].id}`)
      .set('Authorization', `Bearer ${tokens[0]}`)
      .expect(200);

    const afterRemoval = await request(app.getHttpServer())
      .get(`/api/groups/${groupId}/balances`)
      .set('Authorization', `Bearer ${tokens[0]}`)
      .expect(200);
    expect(afterRemoval.body.balances).toHaveLength(3);
    expect(afterRemoval.body.balances).toContainEqual(
      expect.objectContaining({ userId: users[1].id, name: null }),
    );

    await request(app.getHttpServer())
      .get(`/api/groups/${groupId}/expenses`)
      .set('Authorization', `Bearer ${tokens[1]}`)
      .expect(403);
  });
});
