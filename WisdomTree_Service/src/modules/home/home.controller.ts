import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { JwtAuthGuard } from 'src/common/guards/token.guard';
import { ApiResponse } from 'src/common/interfaces/res.interface';

@Controller('home')
@UseGuards(JwtAuthGuard)
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  /**
   * 首页动态：最近认领 / 最新日记 / 热门帖子
   * query: { limit? }
   */
  @Get('feed')
  async getFeed(@Query('limit') limit?: string): Promise<ApiResponse> {
    return await this.homeService.getFeed(limit ? Number(limit) : 5);
  }
}
