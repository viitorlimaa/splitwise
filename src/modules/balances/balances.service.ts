import { Injectable } from '@nestjs/common';

@Injectable()
export class BalancesService {
  async getGroupBalances(groupId: string) {
    return {
      groupId,
      balances: [],
      simplifiedDebts: [],
      status: 'pending-implementation',
      message: 'Balance calculation will be implemented in the next phase.',
    };
  }
}
