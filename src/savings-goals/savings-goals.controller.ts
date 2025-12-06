import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service';
import { CreateSavingsGoalDto, UpdateSavingsGoalDto, UpdateSavingsGoalAmountDto, SavingsGoalProgressDto } from './savings-goals.dto';
import { SavingsGoal } from './savings-goals.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetCurrentUser } from '../auth/get-current-user.decorator';
import { User } from '../users/users.entity';

@Controller('api/savings-goals')
@UseGuards(JwtAuthGuard)
export class SavingsGoalsController {
  constructor(private readonly savingsGoalsService: SavingsGoalsService) {}

  @Post()
  async create(@Body() createSavingsGoalDto: CreateSavingsGoalDto, @GetCurrentUser() user: User): Promise<SavingsGoal> {
    return this.savingsGoalsService.create(user.id, createSavingsGoalDto);
  }

  @Get()
  async findAll(@GetCurrentUser() user: User): Promise<SavingsGoal[]> {
    return this.savingsGoalsService.findAllByUserId(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @GetCurrentUser() user: User): Promise<SavingsGoal> {
    return this.savingsGoalsService.findOne(+id, user.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSavingsGoalDto: UpdateSavingsGoalDto, @GetCurrentUser() user: User): Promise<SavingsGoal> {
    return this.savingsGoalsService.update(+id, user.id, updateSavingsGoalDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @GetCurrentUser() user: User): Promise<void> {
    return this.savingsGoalsService.remove(+id, user.id);
  }

  @Put(':id/amount')
  async updateAmount(@Param('id') id: string, @Body() updateSavingsGoalAmountDto: UpdateSavingsGoalAmountDto, @GetCurrentUser() user: User): Promise<SavingsGoal> {
    return this.savingsGoalsService.updateAmount(+id, user.id, updateSavingsGoalAmountDto);
  }

  @Get(':id/progress')
  async getProgress(@Param('id') id: string, @GetCurrentUser() user: User): Promise<SavingsGoalProgressDto> {
    return this.savingsGoalsService.getProgress(+id, user.id);
  }
}
