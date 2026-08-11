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
import { AdminScenicService } from '../service/adminScenic.service';
import { CreateScenicDto, UpdateScenicDto } from '../dto/adminScenic.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminScenicController {
  constructor(private readonly adminScenicService: AdminScenicService) {}

  @Get('scenic/list')
  async getScenicList(@Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    return await this.adminScenicService.getScenicList(+page, +pageSize);
  }

  @Post('scenic/create')
  async createScenic(@Body() dto: CreateScenicDto) {
    return await this.adminScenicService.createScenic(dto);
  }

  @Put('scenic/:id')
  async updateScenic(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScenicDto,
  ) {
    return await this.adminScenicService.updateScenic(id, dto);
  }

  @Delete('scenic/:id')
  async deleteScenic(@Param('id', ParseIntPipe) id: number) {
    return await this.adminScenicService.deleteScenic(id);
  }
}
