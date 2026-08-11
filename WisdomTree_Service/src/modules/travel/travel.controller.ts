import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TravelService } from './travel.service';
import { JwtAuthGuard } from 'src/common/guards/token.guard';
import { ReqDto } from '../token/dto/token.dto';
import {
  AdjustJourneyDto,
  AgentSaveJourneyDto,
  CreateReservationDto,
  SaveJourneyDto,
} from './dto/travel.dto';

@Controller('travel')
@UseGuards(JwtAuthGuard)
export class TravelController {
  constructor(private readonly travelService: TravelService) {}

  /**
   * 线路列表（可按分类筛选）
   */
  @Get('routes')
  async getRoutes(@Query('category') category?: string) {
    return await this.travelService.getRoutes(category);
  }

  /**
   * 线路详情（含全部站点）
   */
  @Get('routes/:routeId')
  async getRouteDetail(@Param('routeId', ParseIntPipe) routeId: number) {
    return await this.travelService.getRouteDetail(routeId);
  }

  /**
   * 设施名录（可按类型筛选）
   */
  @Get('facilities')
  async getFacilities(@Query('type') type?: string) {
    return await this.travelService.getFacilities(type);
  }

  /**
   * 设施地图标记（仅含经纬度的设施，可按类型筛选）
   */
  @Get('facilities/map')
  async getFacilitiesMap(@Query('type') type?: string) {
    return await this.travelService.getFacilitiesMap(type);
  }

  /**
   * 创建线路预约
   */
  @Post('reserve')
  async createReservation(
    @Body() body: CreateReservationDto,
    @Request() req: ReqDto,
  ) {
    return await this.travelService.createReservation(req.user.id, body);
  }

  /**
   * 我的预约列表
   */
  @Get('my-reservations')
  async getMyReservations(@Request() req: ReqDto) {
    return await this.travelService.getMyReservations(req.user.id);
  }

  /**
   * 取消预约
   */
  @Post('reservations/:id/cancel')
  async cancelReservation(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: ReqDto,
  ) {
    return await this.travelService.cancelReservation(req.user.id, id);
  }

  /**
   * 旅程列表（type=template|mine|all，默认 all；category 可选按分类筛选）
   */
  @Get('journeys')
  async getJourneys(
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Request() req?: ReqDto,
  ) {
    return await this.travelService.getJourneys(req.user.id, type, category);
  }

  /**
   * 旅程详情（含站点，按 order_index 排序）
   */
  @Get('journeys/:journeyId')
  async getJourneyDetail(
    @Param('journeyId', ParseIntPipe) journeyId: number,
    @Request() req: ReqDto,
  ) {
    return await this.travelService.getJourneyDetail(req.user.id, journeyId);
  }

  /**
   * 保存旅程（source 由请求方指定：'ai' | 'manual'，默认 'ai'）
   */
  @Post('journeys/save')
  async saveJourney(@Body() body: SaveJourneyDto, @Request() req: ReqDto) {
    return await this.travelService.saveJourney(req.user.id, body);
  }

  /**
   * 手动调整旅程（仅本人旅程，整体替换站点）
   */
  @Post('journeys/:journeyId/adjust')
  async adjustJourney(
    @Param('journeyId', ParseIntPipe) journeyId: number,
    @Body() body: AdjustJourneyDto,
    @Request() req: ReqDto,
  ) {
    return await this.travelService.adjustJourney(req.user.id, journeyId, body);
  }

  /**
   * 从 AI 生成结果（TripTool schedule）保存旅程
   */
  @Post('agent/save-journey')
  async saveAgentJourney(
    @Body() body: AgentSaveJourneyDto,
    @Request() req: ReqDto,
  ) {
    return await this.travelService.saveAgentJourney(req.user.id, body);
  }
}
