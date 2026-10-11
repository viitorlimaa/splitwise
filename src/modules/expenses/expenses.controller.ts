import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { ExpensesService } from './expenses.service.js';

type AuthenticatedRequest = Request & { user: { sub: string } };

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post(':groupId/expenses')
  create(
    @Param('groupId') groupId: string,
    @Req() request: AuthenticatedRequest,
    @Body() data: CreateExpenseDto,
  ) {
    return this.expensesService.createExpense(groupId, request.user.sub, data);
  }

  @Get(':groupId/expenses')
  list(@Param('groupId') groupId: string) {
    return this.expensesService.listExpenses(groupId);
  }
}
