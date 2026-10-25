import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { ExpensesService } from './expenses.service.js';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post(':groupId/expenses')
  create(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser('sub') userId: string,
    @Body() data: CreateExpenseDto,
  ) {
    return this.expensesService.createExpense(groupId, userId, data);
  }

  @Get(':groupId/expenses')
  list(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.expensesService.listExpenses(groupId, userId);
  }
}
