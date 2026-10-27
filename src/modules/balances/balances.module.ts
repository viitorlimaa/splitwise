import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { BalancesController } from './balances.controller.js';
import { BalancesService } from './balances.service.js';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [BalancesController],
  providers: [BalancesService],
  exports: [BalancesService],
})
export class BalancesModule {}
