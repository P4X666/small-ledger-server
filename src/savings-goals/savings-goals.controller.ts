import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SavingsGoalsService } from './savings-goals.service';
import {
  CreateSavingsGoalDto,
  UpdateSavingsGoalDto,
  UpdateSavingsGoalAmountDto,
  SavingsGoalProgressDto,
} from './savings-goals.dto';
import { SavingsGoal } from './savings-goals.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetCurrentUser } from '../auth/get-current-user.decorator';
import { User } from '../users/users.entity';

@ApiTags('SavingsGoals')
@Controller('api/savings-goals')
@UseGuards(JwtAuthGuard)
export class SavingsGoalsController {
  constructor(private readonly savingsGoalsService: SavingsGoalsService) {}

  @Post()
  @ApiOperation({ summary: '创建攒钱目标' })
  @ApiResponse({ status: 201, description: '创建成功', type: SavingsGoal })
  async create(
    @Body() createSavingsGoalDto: CreateSavingsGoalDto,
    @GetCurrentUser() user: User,
  ): Promise<SavingsGoal> {
    return this.savingsGoalsService.create(user.id, createSavingsGoalDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有攒钱目标' })
  @ApiResponse({ status: 200, description: '获取成功', type: [SavingsGoal] })
  async findAll(@GetCurrentUser() user: User): Promise<SavingsGoal[]> {
    return this.savingsGoalsService.findAllByUserId(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个攒钱目标' })
  @ApiParam({ name: 'id', description: '攒钱目标ID' })
  @ApiResponse({ status: 200, description: '获取成功', type: SavingsGoal })
  async findOne(
    @Param('id') id: string,
    @GetCurrentUser() user: User,
  ): Promise<SavingsGoal> {
    return this.savingsGoalsService.findOne(+id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新攒钱目标' })
  @ApiParam({ name: 'id', description: '攒钱目标ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: SavingsGoal })
  async update(
    @Param('id') id: string,
    @Body() updateSavingsGoalDto: UpdateSavingsGoalDto,
    @GetCurrentUser() user: User,
  ): Promise<SavingsGoal> {
    return this.savingsGoalsService.update(+id, user.id, updateSavingsGoalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除攒钱目标' })
  @ApiParam({ name: 'id', description: '攒钱目标ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(
    @Param('id') id: string,
    @GetCurrentUser() user: User,
  ): Promise<void> {
    return this.savingsGoalsService.remove(+id, user.id);
  }

  @Put(':id/amount')
  @ApiOperation({ summary: '更新攒钱目标金额' })
  @ApiParam({ name: 'id', description: '攒钱目标ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: SavingsGoal })
  async updateAmount(
    @Param('id') id: string,
    @Body() updateSavingsGoalAmountDto: UpdateSavingsGoalAmountDto,
    @GetCurrentUser() user: User,
  ): Promise<SavingsGoal> {
    return this.savingsGoalsService.updateAmount(
      +id,
      user.id,
      updateSavingsGoalAmountDto,
    );
  }

  @Get(':id/progress')
  @ApiOperation({ summary: '获取攒钱目标进度' })
  @ApiParam({ name: 'id', description: '攒钱目标ID' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: SavingsGoalProgressDto,
  })
  async getProgress(
    @Param('id') id: string,
    @GetCurrentUser() user: User,
  ): Promise<SavingsGoalProgressDto> {
    return this.savingsGoalsService.getProgress(+id, user.id);
  }
}
