import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ExpensesService } from './expenses.service.js';

describe('ExpensesService', () => {
  const prismaMock = {
    group: {
      findUnique: vi.fn(),
    },
    expense: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };
  const service = new ExpensesService(prismaMock as unknown as PrismaService);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createExpense', () => {
    it('creates an expense with exact equal splits and selected participants', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        members: [
          { userId: 'user-b' },
          { userId: 'user-a' },
          { userId: 'user-c' },
        ],
      });
      prismaMock.expense.create.mockResolvedValue({ id: 'expense-id' });

      await expect(
        service.createExpense('group-id', 'user-a', {
          description: 'Jantar',
          amountCents: 1000,
          paidById: 'user-b',
          participantIds: ['user-c', 'user-a', 'user-b'],
        }),
      ).resolves.toEqual({ id: 'expense-id' });

      expect(prismaMock.group.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            groupId: 'group-id',
            paidById: 'user-b',
            description: 'Jantar',
            amountCents: 1000,
            splits: {
              create: [
                { userId: 'user-a', amountCents: 334 },
                { userId: 'user-b', amountCents: 333 },
                { userId: 'user-c', amountCents: 333 },
              ],
            },
          },
        }),
      );
    });

    it('rejects a requester who is not a group member', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        members: [{ userId: 'member-id' }],
      });

      await expect(
        service.createExpense('group-id', 'outsider-id', {
          description: 'Jantar',
          amountCents: 1000,
          paidById: 'member-id',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prismaMock.expense.create).not.toHaveBeenCalled();
    });

    it('rejects a payer who is not a group member as a bad request', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        members: [{ userId: 'member-id' }],
      });

      await expect(
        service.createExpense('group-id', 'member-id', {
          description: 'Jantar',
          amountCents: 1000,
          paidById: 'outsider-id',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.expense.create).not.toHaveBeenCalled();
    });

    it('defaults the payer to the requester and participants to all members', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        members: [{ userId: 'user-b' }, { userId: 'user-a' }],
      });
      prismaMock.expense.create.mockResolvedValue({ id: 'expense-id' });

      await service.createExpense('group-id', 'user-a', {
        description: 'Jantar',
        amountCents: 1000,
      });

      expect(prismaMock.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            groupId: 'group-id',
            paidById: 'user-a',
            description: 'Jantar',
            amountCents: 1000,
            splits: {
              create: [
                { userId: 'user-a', amountCents: 500 },
                { userId: 'user-b', amountCents: 500 },
              ],
            },
          },
        }),
      );
    });

    it('rejects participants who are not group members', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        members: [{ userId: 'user-a' }],
      });

      await expect(
        service.createExpense('group-id', 'user-a', {
          description: 'Jantar',
          amountCents: 1000,
          participantIds: ['outsider'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.expense.create).not.toHaveBeenCalled();
    });

    it('returns not found when the group does not exist', async () => {
      prismaMock.group.findUnique.mockResolvedValue(null);

      await expect(
        service.createExpense('missing-group', 'user-id', {
          description: 'Jantar',
          amountCents: 1000,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listExpenses', () => {
    it('lists expenses only for a group member', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        members: [{ userId: 'user-id' }],
      });
      prismaMock.expense.findMany.mockResolvedValue([]);

      await expect(
        service.listExpenses('group-id', 'user-id'),
      ).resolves.toEqual([]);
      expect(prismaMock.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { groupId: 'group-id' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('rejects non-members from listing group expenses', async () => {
      prismaMock.group.findUnique.mockResolvedValue({ members: [] });

      await expect(
        service.listExpenses('group-id', 'outsider-id'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prismaMock.expense.findMany).not.toHaveBeenCalled();
    });

    it('returns not found when the group does not exist', async () => {
      prismaMock.group.findUnique.mockResolvedValue(null);

      await expect(
        service.listExpenses('missing-group', 'user-id'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
