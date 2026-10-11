import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  it('registers a user and returns a JWT without the password hash', async () => {
    const createdUser = {
      id: 'user-id',
      name: 'Maria',
      email: 'maria@example.com',
      createdAt: new Date(),
    };
    const prismaMock = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createdUser),
      },
    };
    const prisma = prismaMock as unknown as PrismaService;
    const jwt = { sign: vi.fn().mockReturnValue('signed-token') };
    const service = new AuthService(prisma, jwt as never);

    await expect(
      service.register({
        name: ' Maria ',
        email: 'MARIA@example.com',
        password: 'strong-password',
      }),
    ).resolves.toEqual({ accessToken: 'signed-token', user: createdUser });

    const createCall = prismaMock.user.create.mock.calls[0][0];
    expect(createCall.data).toMatchObject({
      name: 'Maria',
      email: 'maria@example.com',
    });
    expect(createCall.data.passwordHash).toContain(':');
  });

  it('rejects an invalid password', async () => {
    const prismaMock = {
      user: {
        findUnique: vi.fn(),
      },
    };
    const prisma = prismaMock as unknown as PrismaService;
    const jwt = { sign: vi.fn() };
    const service = new AuthService(prisma, jwt as never);

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-id',
      name: 'Maria',
      email: 'maria@example.com',
      createdAt: new Date(),
      passwordHash: 'salt:invalid-hash',
    });

    await expect(
      service.login({ email: 'maria@example.com', password: 'wrong-password' }),
    ).rejects.toThrow('E-mail ou senha inválidos');
  });
});
