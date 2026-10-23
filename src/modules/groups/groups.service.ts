import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { normalizeEmail } from '../auth/auth.utils.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { CreateGroupDto } from './dto/create-group.dto.js';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async createGroup(userId: string, data: CreateGroupDto) {
    const group = await this.prisma.group.create({
      data: {
        name: data.name.trim(),
        createdById: userId,
        members: {
          create: {
            userId,
          },
        },
      },
      include: {
        members: true,
      },
    });

    return group;
  }

  async listGroups(userId: string) {
    return this.prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  }

  async addMember(groupId: string, requesterId: string, data: AddMemberDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    if (group.createdById !== requesterId) {
      throw new ForbiddenException('Somente o criador pode adicionar membros');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(data.email) },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    try {
      return await this.prisma.groupMember.create({
        data: {
          groupId,
          userId: user.id,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Usuário já é membro do grupo');
      }

      throw error;
    }
  }
}
