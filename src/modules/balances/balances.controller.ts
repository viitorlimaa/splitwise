import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { BalancesService } from './balances.service.js';

@ApiTags('balances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get(':groupId/balances')
  getBalances(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.balancesService.getGroupBalances(groupId);
  }
}
