import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AdoptionService } from './adoption.service';
import { JwtAuthGuard } from 'src/common/guards/token.guard';
import { ReqDto } from '../token/dto/token.dto';
import { CreateAdoptionDto, CreateDiaryDto, PickupHarvestDto, ShipHarvestDto } from './dto/adoption.dto';
import { ApiResponse } from 'src/common/interfaces/res.interface';

@Controller('adoption')
@UseGuards(JwtAuthGuard)
export class AdoptionController {
  constructor(private readonly adoptionService: AdoptionService) {}

  /**
   * 认领下单
   * body: { productId, wish?, area?, nickname? }
   */
  @Post()
  async createAdoption(
    @Body() body: CreateAdoptionDto,
    @Request() req: ReqDto,
  ): Promise<ApiResponse> {
    return await this.adoptionService.createAdoption(req.user.id, body);
  }

  /**
   * 我的认领列表（含产品名/图片/状态/合约/溯源码/日记数）
   */
  @Get('my')
  async getMyAdoptions(@Request() req: ReqDto): Promise<ApiResponse> {
    return await this.adoptionService.getMyAdoptions(req.user.id);
  }

  /**
   * 认领详情
   */
  @Get(':id')
  async getAdoptionDetail(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: ReqDto,
  ): Promise<ApiResponse> {
    return await this.adoptionService.getAdoptionDetail(id, req.user.id);
  }

  /**
   * 写日记（+1 积分）
   * body: { stage, description, temperature?, humidity?, mediaUrl? }
   */
  @Post(':id/diary')
  async createDiary(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateDiaryDto,
    @Request() req: ReqDto,
  ): Promise<ApiResponse> {
    return await this.adoptionService.createDiary(id, req.user.id, body);
  }

  /**
   * 该认领的日记列表
   */
  @Get(':id/diary')
  async getDiaries(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: ReqDto,
  ): Promise<ApiResponse> {
    return await this.adoptionService.getDiaries(id, req.user.id);
  }

  /**
   * 预约采摘（仅 growing 可调，认领状态 → harvesting）
   * body: { pickupDate, pickupTime?, partySize?, contactName?, contactPhone? }
   */
  @Post(':id/harvest/pickup')
  async pickupHarvest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: PickupHarvestDto,
    @Request() req: ReqDto,
  ): Promise<ApiResponse> {
    return await this.adoptionService.pickupHarvest(id, req.user.id, body);
  }

  /**
   * 邮寄到家（仅 growing 可调，认领状态 → completed）
   * body: { address, receiverName, receiverPhone?, shipMethod?, remark? }
   */
  @Post(':id/harvest/ship')
  async shipHarvest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ShipHarvestDto,
    @Request() req: ReqDto,
  ): Promise<ApiResponse> {
    return await this.adoptionService.shipHarvest(id, req.user.id, body);
  }

  /**
   * 查询收获状态
   */
  @Get(':id/harvest')
  async getHarvestStatus(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: ReqDto,
  ): Promise<ApiResponse> {
    return await this.adoptionService.getHarvestStatus(id, req.user.id);
  }
}
