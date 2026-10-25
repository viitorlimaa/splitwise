import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { splitEqually } from './split-equally.js';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async createExpense(
    groupId: string,
    requesterId: string,
    data: CreateExpenseDto,
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        members: {
          select: { userId: true },
          orderBy: { userId: 'asc' },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    const memberIds = group.members.map((member) => member.userId);
    if (!memberIds.includes(requesterId)) {
      throw new ForbiddenException('Você não é membro deste grupo');
    }

    const paidById = data.paidById ?? requesterId;
    if (!memberIds.includes(paidById)) {
      throw new BadRequestException('Pagador não pertence ao grupo');
    }

    const participantIds = data.participantIds ?? memberIds;
    if (participantIds.some((userId) => !memberIds.includes(userId))) {
      throw new BadRequestException(
        'Todos os participantes devem pertencer ao grupo',
      );
    }

    return this.prisma.expense.create({
      data: {
        groupId,
        paidById,
        description: data.description,
        amountCents: data.amountCents,
        splits: {
          create: splitEqually(data.amountCents, participantIds),
        },
      },
      include: {
        paidBy: { select: { id: true, name: true, email: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  async listExpenses(groupId: string, requesterId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        members: {
          where: { userId: requesterId },
          select: { userId: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    if (group.members.length === 0) {
      throw new ForbiddenException('Você não é membro deste grupo');
    }

    return this.prisma.expense.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: {
        paidBy: { select: { id: true, name: true, email: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }
}
