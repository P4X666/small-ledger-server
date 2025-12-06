import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingsGoal } from './savings-goals.entity';
import { SavingsGoalsService } from './savings-goals.service';
import { SavingsGoalsController } from './savings-goals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SavingsGoal])],
  controllers: [SavingsGoalsController],
  providers: [SavingsGoalsService],
  exports: [SavingsGoalsService],
})
export class SavingsGoalsModule {}
