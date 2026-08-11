import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FarmerGuard } from '../admin/guard/farmer.guard';
import { ReqDto } from '../token/dto/token.dto';
import { FarmerService } from './farmer.service';
import {
  FarmerEmptyBodyDto,
  FarmerStatusQueryDto,
  UpdateFarmerProfileDto,
} from './dto/farmer.dto';
import { ApiResponse } from 'src/common/interfaces/res.interface';

@Controller('farmer')
@UseGuards(FarmerGuard)
export class FarmerController {
  constructor(private readonly farmerService: FarmerService) {}

  // 农户信息
  @Get('profile')
  async getProfile(@Req() req: ReqDto): Promise<ApiResponse> {
    return await this.farmerService.getProfile(req.user.id);
  }

  // 更新农户信息
  @Put('profile')
  async updateProfile(
    @Req() req: ReqDto,
    @Body() body: UpdateFarmerProfileDto,
  ): Promise<ApiResponse> {
    return await this.farmerService.updateProfile(req.user.id, body);
  }

  // 我名下产品分类列表
  @Get('products')
  async getMyProducts(@Req() req: ReqDto): Promise<ApiResponse> {
    return await this.farmerService.getMyProducts(req.user.id);
  }

  // 我名下认领订单列表（可按状态筛选）
  @Get('adoptions')
  async getMyAdoptions(
    @Req() req: ReqDto,
    @Query() query: FarmerStatusQueryDto,
  ): Promise<ApiResponse> {
    return await this.farmerService.getMyAdoptions(
      req.user.id,
      query.status,
    );
  }

  // 确认认领单
  @Post('adoptions/:id/confirm')
  async confirmAdoption(
    @Req() req: ReqDto,
    @Param('id', ParseIntPipe) id: number,
    @Body() _body: FarmerEmptyBodyDto,
  ): Promise<ApiResponse> {
    return await this.farmerService.confirmAdoption(req.user.id, id);
  }

  // 履约完成
  @Post('adoptions/:id/complete')
  async completeAdoption(
    @Req() req: ReqDto,
    @Param('id', ParseIntPipe) id: number,
    @Body() _body: FarmerEmptyBodyDto,
  ): Promise<ApiResponse> {
    return await this.farmerService.completeAdoption(req.user.id, id);
  }

  // 收益中心
  @Get('revenue')
  async getRevenue(@Req() req: ReqDto): Promise<ApiResponse> {
    return await this.farmerService.getRevenue(req.user.id);
  }

  // 数据看板
  @Get('dashboard')
  async getDashboard(@Req() req: ReqDto): Promise<ApiResponse> {
    return await this.farmerService.getDashboard(req.user.id);
  }
}
