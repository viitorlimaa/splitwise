import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { BalancesService } from './balances.service.js';
import { GroupBalancesDto } from './dto/group-balances.dto.js';

@ApiTags('balances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get(':groupId/balances')
  @ApiOkResponse({ type: GroupBalancesDto })
  getBalances(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.balancesService.getGroupBalances(groupId, userId);
  }
}
