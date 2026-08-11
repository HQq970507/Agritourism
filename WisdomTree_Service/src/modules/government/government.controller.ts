import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GovernmentGuard } from '../admin/guard/government.guard';
import { GovernmentService } from './government.service';
import {
  FarmerListQueryDto,
  GovernmentEmptyBodyDto,
  UpdateFarmerStatusDto,
} from './dto/government.dto';
import { ApiResponse } from 'src/common/interfaces/res.interface';

@Controller('government')
@UseGuards(GovernmentGuard)
export class GovernmentController {
  constructor(private readonly governmentService: GovernmentService) {}

  // 农户监管列表（可按状态筛选）
  @Get('farmers')
  async getFarmers(@Query() query: FarmerListQueryDto): Promise<ApiResponse> {
    return await this.governmentService.getFarmers(query.status);
  }

  // 审核/封禁农户
  @Put('farmers/:id/status')
  async updateFarmerStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateFarmerStatusDto,
  ): Promise<ApiResponse> {
    return await this.governmentService.updateFarmerStatus(id, body.status);
  }

  // 全区产品监管列表（可按农户筛选）
  @Get('products')
  async getProducts(
    @Query('farmerId', new ParseIntPipe({ optional: true })) farmerId?: number,
  ): Promise<ApiResponse> {
    return await this.governmentService.getProducts(farmerId);
  }

  // 下架产品
  @Post('products/:id/off-shelf')
  async offShelfProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() _body: GovernmentEmptyBodyDto,
  ): Promise<ApiResponse> {
    return await this.governmentService.offShelfProduct(id);
  }

  // 区域报告：按市汇总
  @Get('report/region')
  async getRegionReport(): Promise<ApiResponse> {
    return await this.governmentService.getRegionReport();
  }

  // 总览
  @Get('report/overview')
  async getOverview(): Promise<ApiResponse> {
    return await this.governmentService.getOverview();
  }
}
