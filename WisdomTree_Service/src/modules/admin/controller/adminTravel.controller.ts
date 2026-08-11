import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../guard/admin.guard';
import { AdminTravelService } from '../service/adminTravel.service';
import {
  CreateFacilityDto,
  CreateRouteDto,
  UpdateFacilityDto,
  UpdateReservationStatusDto,
  UpdateRouteDto,
} from '../dto/adminTravel.dto';

@Controller('admin/travel')
@UseGuards(AdminGuard)
export class AdminTravelController {
  constructor(private readonly adminTravelService: AdminTravelService) {}

  // ==================== 线路管理 ====================

  // 线路列表（含站点），可按 category 筛选
  @Get('routes')
  async getAdminRoutes(@Query('category') category?: string) {
    return await this.adminTravelService.getAdminRoutes(category);
  }

  // 新增线路（含站点数组）
  @Post('routes')
  async createRoute(@Body() body: CreateRouteDto) {
    return await this.adminTravelService.createRoute(body);
  }

  // 修改线路（含站点数组）
  @Put('routes/:id')
  async updateRoute(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateRouteDto,
  ) {
    return await this.adminTravelService.updateRoute(id, body);
  }

  // 删除线路（有未取消预约则拒绝）
  @Delete('routes/:id')
  async deleteRoute(@Param('id', ParseIntPipe) id: number) {
    return await this.adminTravelService.deleteRoute(id);
  }

  // ==================== 设施管理 ====================

  // 设施列表，可按 type 筛选
  @Get('facilities')
  async getAdminFacilities(@Query('type') type?: string) {
    return await this.adminTravelService.getAdminFacilities(type);
  }

  // 新增设施
  @Post('facilities')
  async createFacility(@Body() body: CreateFacilityDto) {
    return await this.adminTravelService.createFacility(body);
  }

  // 修改设施
  @Put('facilities/:id')
  async updateFacility(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateFacilityDto,
  ) {
    return await this.adminTravelService.updateFacility(id, body);
  }

  // 删除设施
  @Delete('facilities/:id')
  async deleteFacility(@Param('id', ParseIntPipe) id: number) {
    return await this.adminTravelService.deleteFacility(id);
  }

  // ==================== 预约管理 ====================

  // 全部预约列表（含线路名/用户名）
  @Get('reservations')
  async getAdminReservations() {
    return await this.adminTravelService.getAdminReservations();
  }

  // 修改预约状态
  @Put('reservations/:id/status')
  async updateReservationStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateReservationStatusDto,
  ) {
    return await this.adminTravelService.updateReservationStatus(id, body.status);
  }
}
