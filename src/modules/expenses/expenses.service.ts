import { Injectable } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto.js';

@Injectable()
export class ExpensesService {
  async createExpense(groupId: string, userId: string, data: CreateExpenseDto) {
    return {
      groupId,
      createdBy: userId,
      description: data.description,
      amount: data.amount,
      payerId: data.payerId,
      status: 'pending-implementation',
      message: 'Expense logic will be implemented in the next phase.',
    };
  }

  async listExpenses(groupId: string) {
    return {
      groupId,
      expenses: [],
      status: 'pending-implementation',
      message: 'List of expenses will be implemented in the next phase.',
    };
  }
}
