import { Injectable, NotFoundException } from '@nestjs/common';
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
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async addMember(groupId: string, data: AddMemberDto) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    return this.prisma.groupMember.create({
      data: {
        groupId,
        userId: data.userId,
      },
      include: { user: true },
    });
  }

  async removeMember(groupId: string, memberId: string) {
    const groupMember = await this.prisma.groupMember.findFirst({
      where: { groupId, id: memberId },
    });

    if (!groupMember) {
      throw new NotFoundException('Membro não encontrado no grupo');
    }

    return this.prisma.groupMember.delete({
      where: { id: memberId },
    });
  }
}
