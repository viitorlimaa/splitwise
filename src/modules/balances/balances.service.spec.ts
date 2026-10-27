import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { BalancesService } from './balances.service.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('BalancesService', () => {
  const prismaMock = {
    group: {
      findUnique: vi.fn(),
    },
  };
  const service = new BalancesService(prismaMock as unknown as PrismaService);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calculates balances and returns only safe member names', async () => {
    prismaMock.group.findUnique.mockResolvedValue({
      members: [
        { userId: 'user-a', user: { id: 'user-a', name: 'Ana' } },
        { userId: 'user-b', user: { id: 'user-b', name: 'Bia' } },
        { userId: 'user-c', user: { id: 'user-c', name: 'Caio' } },
      ],
      expenses: [
        {
          paidById: 'user-a',
          amountCents: 9000,
          splits: [
            { userId: 'user-a', amountCents: 3000 },
            { userId: 'user-b', amountCents: 3000 },
            { userId: 'user-c', amountCents: 3000 },
          ],
        },
      ],
    });

    await expect(
      service.getGroupBalances('group-id', 'user-a'),
    ).resolves.toEqual({
      groupId: 'group-id',
      balances: [
        { userId: 'user-a', name: 'Ana', balanceCents: 6000 },
        { userId: 'user-b', name: 'Bia', balanceCents: -3000 },
        { userId: 'user-c', name: 'Caio', balanceCents: -3000 },
      ],
    });
    expect(prismaMock.group.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaMock.group.findUnique).toHaveBeenCalledWith({
      where: { id: 'group-id' },
      select: {
        members: {
          select: {
            userId: true,
            user: { select: { id: true, name: true } },
          },
        },
        expenses: {
          select: {
            paidById: true,
            amountCents: true,
            splits: { select: { userId: true, amountCents: true } },
          },
        },
      },
    });
  });

  it('returns not found when the group does not exist', async () => {
    prismaMock.group.findUnique.mockResolvedValue(null);

    await expect(
      service.getGroupBalances('missing-group', 'user-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a requester who is not a group member', async () => {
    prismaMock.group.findUnique.mockResolvedValue({
      members: [{ userId: 'member-id', user: { id: 'member-id', name: 'M' } }],
      expenses: [],
    });

    await expect(
      service.getGroupBalances('group-id', 'outsider-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns a null name for expense IDs outside the group member list', async () => {
    prismaMock.group.findUnique.mockResolvedValue({
      members: [{ userId: 'user-a', user: { id: 'user-a', name: 'Ana' } }],
      expenses: [
        {
          paidById: 'user-a',
          amountCents: 500,
          splits: [
            { userId: 'user-a', amountCents: 300 },
            { userId: 'former-member', amountCents: 200 },
          ],
        },
      ],
    });

    await expect(
      service.getGroupBalances('group-id', 'user-a'),
    ).resolves.toEqual({
      groupId: 'group-id',
      balances: [
        { userId: 'former-member', name: null, balanceCents: -200 },
        { userId: 'user-a', name: 'Ana', balanceCents: 200 },
      ],
    });
  });
});
