import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { TraceabilityEntity } from 'src/database/entities/traceability.entity';
import { ApiResponse } from 'src/common/interfaces/res.interface';

@Injectable()
export class TraceabilityService {
  constructor(
    @InjectRepository(TraceabilityEntity)
    private readonly repo: Repository<TraceabilityEntity>,
  ) {}

  /**
   * Generate unique trace code
   * Format: T + YYYYMMDD + random 6 hex chars
   * Example: T20260730A3F2B1
   */
  async generateTraceCode(
    orderId: number,
    productId: number,
  ): Promise<string> {
    const dateStr = dayjs().format('YYYYMMDD');
    const randomHex = uuidv4().replace(/-/g, '').substring(0, 6).toUpperCase();
    const traceCode = `T${dateStr}${randomHex}`;

    // Save initial record with stage='planting'
    await this.repo.save({
      trace_code: traceCode,
      order_id: orderId,
      product_id: productId,
      stage: 'planting',
    });

    return traceCode;
  }

  /**
   * Record a new trace event
   */
  async recordEvent(
    code: string,
    data: Partial<TraceabilityEntity>,
  ): Promise<ApiResponse> {
    try {
      const existing = await this.repo.findOne({
        where: { trace_code: code },
      });

      if (!existing) {
        // First event - create new record
        const record = this.repo.create({
          trace_code: code,
          ...data,
        });
        const saved = await this.repo.save(record);
        return {
          status: HttpStatus.OK,
          code: 0,
          message: '追溯事件记录成功',
          data: saved,
        };
      }

      // Subsequent events - append new record (each event is a separate row)
      const record = this.repo.create({
        trace_code: code,
        order_id: data.order_id ?? existing.order_id,
        product_id: data.product_id ?? existing.product_id,
        ...data,
      });
      const saved = await this.repo.save(record);
      return {
        status: HttpStatus.OK,
        code: 0,
        message: '追溯事件记录成功',
        data: saved,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get full trace timeline for a trace code
   */
  async getTraceTimeline(code: string): Promise<ApiResponse> {
    try {
      const events = await this.repo.find({
        where: { trace_code: code },
        order: { recorded_at: 'ASC' },
      });

      if (!events || events.length === 0) {
        return {
          status: HttpStatus.OK,
          code: 1,
          message: '未找到该追溯码的记录',
          data: { trace_code: code, events: [] },
        };
      }

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '查询成功',
        data: {
          trace_code: code,
          events,
        },
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Query trace by order ID
   */
  async getTraceByOrder(orderId: number): Promise<ApiResponse> {
    try {
      const events = await this.repo.find({
        where: { order_id: orderId },
        order: { recorded_at: 'ASC' },
      });

      if (!events || events.length === 0) {
        return {
          status: HttpStatus.OK,
          code: 1,
          message: '未找到该订单的追溯记录',
          data: [],
        };
      }

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '查询成功',
        data: events,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
