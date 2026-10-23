import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { GroupsService } from './groups.service.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('GroupsService', () => {
  const prismaMock = {
    group: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    groupMember: {
      create: vi.fn(),
    },
  };

  const service = new GroupsService(prismaMock as unknown as PrismaService);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('createGroup', () => {
    it('creates the group with its creator as the first member', async () => {
      prismaMock.group.create.mockResolvedValue({ id: 'group-id' });

      await expect(
        service.createGroup('creator-id', { name: '  Apartamento  ' }),
      ).resolves.toEqual({ id: 'group-id' });

      expect(prismaMock.group.create).toHaveBeenCalledWith({
        data: {
          name: 'Apartamento',
          createdById: 'creator-id',
          members: {
            create: {
              userId: 'creator-id',
            },
          },
        },
        include: {
          members: true,
        },
      });
    });
  });

  describe('addMember', () => {
    it('only allows the group creator to add members', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        id: 'group-id',
        createdById: 'creator-id',
      });

      await expect(
        service.addMember('group-id', 'other-user-id', {
          email: 'new@example.com',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns not found when the group does not exist', async () => {
      prismaMock.group.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember('missing-group', 'creator-id', {
          email: 'new@example.com',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('looks up a member by normalized email before adding them', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        id: 'group-id',
        createdById: 'creator-id',
      });
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'new-user-id',
      });
      prismaMock.groupMember.create.mockResolvedValue({ id: 'member-id' });

      await expect(
        service.addMember('group-id', 'creator-id', {
          email: '  NEW@Example.com ',
        }),
      ).resolves.toEqual({ id: 'member-id' });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      });
      expect(prismaMock.groupMember.create).toHaveBeenCalledWith({
        data: { groupId: 'group-id', userId: 'new-user-id' },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });

    it('returns not found when the email does not belong to a user', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        id: 'group-id',
        createdById: 'creator-id',
      });
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember('group-id', 'creator-id', {
          email: 'missing@example.com',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.groupMember.create).not.toHaveBeenCalled();
    });

    it('converts Prisma unique constraint errors to conflict', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        id: 'group-id',
        createdById: 'creator-id',
      });
      prismaMock.user.findUnique.mockResolvedValue({ id: 'new-user-id' });

      const duplicateError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '7.10.0' },
      );
      prismaMock.groupMember.create.mockRejectedValue(duplicateError);

      await expect(
        service.addMember('group-id', 'creator-id', {
          email: 'new@example.com',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows unexpected database errors', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        id: 'group-id',
        createdById: 'creator-id',
      });
      prismaMock.user.findUnique.mockResolvedValue({ id: 'new-user-id' });
      const unexpectedError = new Error('Database unavailable');
      prismaMock.groupMember.create.mockRejectedValue(unexpectedError);

      await expect(
        service.addMember('group-id', 'creator-id', {
          email: 'new@example.com',
        }),
      ).rejects.toBe(unexpectedError);
    });
  });

  it('returns member counts instead of loading every group member', async () => {
    prismaMock.group.findMany.mockResolvedValue([]);

    await service.listGroups('user-id');

    expect(prismaMock.group.findMany).toHaveBeenCalledWith({
      where: { members: { some: { userId: 'user-id' } } },
      include: { _count: { select: { members: true } } },
    });
  });
});
