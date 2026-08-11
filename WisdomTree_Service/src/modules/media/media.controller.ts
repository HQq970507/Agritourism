import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from 'src/common/guards/token.guard';
import { GenerateDiaryDto } from './dto/media.dto';
import { ApiResponse } from 'src/common/interfaces/res.interface';

/**
 * 媒体控制器
 *
 * 提供认养产品生长日记（时间线）与农场慢直播频道接口。
 */
@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * 获取生长日记时间线
   * GET /media/diary?product=红颜草莓 （不传 product 返回全部）
   */
  @Get('diary')
  async getDiary(
    @Query('product') product?: string,
  ): Promise<ApiResponse> {
    return this.mediaService.getDiary(product);
  }

  /**
   * 生成一条新的生长日记（规则式AI描述）
   * POST /media/diary/generate  { productName: '红颜草莓' }
   */
  @Post('diary/generate')
  async generateDiaryEntry(
    @Body() body: GenerateDiaryDto,
  ): Promise<ApiResponse> {
    return this.mediaService.generateDiaryEntry(body.productName);
  }

  /**
   * 获取慢直播频道列表
   * GET /media/streams
   */
  @Get('streams')
  async getStreams(): Promise<ApiResponse> {
    return this.mediaService.getStreams();
  }

  /**
   * 切换慢直播频道开播状态（管理端演示）
   * POST /media/streams/:id/toggle
   */
  @Post('streams/:id/toggle')
  async toggleStream(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    return this.mediaService.toggleStream(id);
  }
}
