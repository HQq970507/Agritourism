import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ScenicService } from './scenic.service';
import { JwtAuthGuard } from 'src/common/guards/token.guard';

@Controller('scenic')
export class ScenicController {
  constructor(private readonly scenicService: ScenicService) {}

  /**
   * 景区列表（可按城市/级别筛选）
   * 景区名录为公开信息（对应文旅部大众旅游服务栏目），无需登录即可查看。
   */
  @Get('list')
  async getScenicList(
    @Query('city') city?: string,
    @Query('level') level?: string,
  ) {
    return await this.scenicService.getScenicList(city, level);
  }

  /**
   * 景区详情（公开）
   */
  @Get(':id')
  async getScenicDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.scenicService.getScenicDetail(id);
  }

  /**
   * 按城市获取（宁夏地图联动，公开）
   */
  @Get('city/:city')
  async getByCity(@Param('city') city: string) {
    return await this.scenicService.getByCity(city);
  }
}
