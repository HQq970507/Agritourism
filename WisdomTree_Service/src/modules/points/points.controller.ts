import {
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PointsService } from './points.service';
import { JwtAuthGuard } from 'src/common/guards/token.guard';
import { ReqDto } from '../token/dto/token.dto';
import { PaginateQueryDto } from './dto/points.dto';

@Controller('points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  /**
   * 每日签到
   */
  @Post('checkin')
  async checkIn(@Request() req: ReqDto) {
    return await this.pointsService.checkIn(req.user.id);
  }

  /**
   * 获取积分历史记录（分页）
   */
  @Get('history')
  async getHistory(
    @Request() req: ReqDto,
    @Query() query: PaginateQueryDto,
  ) {
    return await this.pointsService.getHistory(
      req.user.id,
      query.page,
      query.pageSize,
    );
  }

  /**
   * 获取积分排行榜
   */
  @Get('leaderboard')
  async getLeaderboard() {
    return await this.pointsService.getLeaderboard(20);
  }

  /**
   * 获取用户积分概览
   */
  @Get('summary')
  async getSummary(@Request() req: ReqDto) {
    return await this.pointsService.getSummary(req.user.id);
  }
}
