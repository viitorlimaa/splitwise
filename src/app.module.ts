import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BalancesModule } from './modules/balances/balances.module.js';
import { ExpensesModule } from './modules/expenses/expenses.module.js';
import { GroupsModule } from './modules/groups/groups.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, AuthModule, GroupsModule, ExpensesModule, BalancesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
