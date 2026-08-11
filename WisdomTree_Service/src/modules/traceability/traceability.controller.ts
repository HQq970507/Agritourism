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
import { ApiResponse } from 'src/common/interfaces/res.interface';
import { TraceabilityService } from './traceability.service';
import { RecordTraceEventDto, TraceQueryDto } from './dto/traceability.dto';
import { AdminGuard } from '../admin/guard/admin.guard';
import { JwtAuthGuard } from 'src/common/guards/token.guard';
import { ReqDto } from 'src/modules/token/dto/token.dto';
import { Request } from '@nestjs/common';

@Controller('trace')
export class TraceabilityController {
  constructor(
    private readonly traceabilityService: TraceabilityService,
  ) {}

  // PUBLIC: Get full trace timeline by trace code
  @Get('query')
  async queryTrace(@Query() query: TraceQueryDto): Promise<ApiResponse> {
    return this.traceabilityService.getTraceTimeline(query.code);
  }

  // ADMIN: Record a new trace event
  @Post('record')
  @UseGuards(AdminGuard)
  async recordEvent(
    @Body() body: RecordTraceEventDto,
  ): Promise<ApiResponse> {
    return this.traceabilityService.recordEvent(body.trace_code, body);
  }

  // USER: Get trace for my order
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getTraceByOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<ApiResponse> {
    return this.traceabilityService.getTraceByOrder(orderId);
  }
}
