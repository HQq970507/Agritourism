import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from 'src/common/interfaces/res.interface';
import { JwtAuthGuard } from 'src/common/guards/token.guard';
import { ReqDto } from 'src/modules/token/dto/token.dto';
import { AutomationService } from './automation.service';
import { CreateAutomationTaskDto } from './dto/automation.dto';

/**
 * 自动化任务控制器
 *
 * 提供自动化任务的创建、查询、日志查看、暂停、恢复、删除接口。
 * 全部接口需要 JWT 认证。
 */
@Controller('automation')
@UseGuards(JwtAuthGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  /** POST /automation/tasks - 创建自动化任务 */
  @Post('tasks')
  async createTask(
    @Request() req: ReqDto,
    @Body() dto: CreateAutomationTaskDto,
  ): Promise<ApiResponse> {
    return this.automationService.createTask(req.user.id, dto);
  }

  /** GET /automation/tasks - 查询我的任务列表（含最近日志） */
  @Get('tasks')
  async getMyTasks(@Request() req: ReqDto): Promise<ApiResponse> {
    return this.automationService.getMyTasks(req.user.id);
  }

  /** GET /automation/tasks/:id/logs - 查询任务执行日志 */
  @Get('tasks/:id/logs')
  async getTaskLogs(
    @Request() req: ReqDto,
    @Param('id', ParseIntPipe) taskId: number,
  ): Promise<ApiResponse> {
    return this.automationService.getTaskLogs(taskId, req.user.id);
  }

  /** POST /automation/tasks/:id/pause - 暂停任务 */
  @Post('tasks/:id/pause')
  async pauseTask(
    @Request() req: ReqDto,
    @Param('id', ParseIntPipe) taskId: number,
  ): Promise<ApiResponse> {
    return this.automationService.pauseTask(taskId, req.user.id);
  }

  /** POST /automation/tasks/:id/resume - 恢复任务 */
  @Post('tasks/:id/resume')
  async resumeTask(
    @Request() req: ReqDto,
    @Param('id', ParseIntPipe) taskId: number,
  ): Promise<ApiResponse> {
    return this.automationService.resumeTask(taskId, req.user.id);
  }

  /** DELETE /automation/tasks/:id - 删除任务 */
  @Delete('tasks/:id')
  async deleteTask(
    @Request() req: ReqDto,
    @Param('id', ParseIntPipe) taskId: number,
  ): Promise<ApiResponse> {
    return this.automationService.deleteTask(taskId, req.user.id);
  }
}
