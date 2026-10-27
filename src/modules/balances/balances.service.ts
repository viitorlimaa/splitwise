import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { calculateBalances } from './calculate-balances.js';

@Injectable()
export class BalancesService {
  constructor(private readonly prisma: PrismaService) {}

  async getGroupBalances(groupId: string, requesterId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
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

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    const memberIds = group.members.map((member) => member.userId);
    if (!memberIds.includes(requesterId)) {
      throw new ForbiddenException('Você não é membro deste grupo');
    }

    const namesByUserId = new Map(
      group.members.map((member) => [member.user.id, member.user.name]),
    );

    return {
      groupId,
      balances: calculateBalances(memberIds, group.expenses).map((balance) => ({
        ...balance,
        name: namesByUserId.get(balance.userId) ?? null,
      })),
    };
  }
}
