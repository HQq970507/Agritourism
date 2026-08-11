import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ContractService } from './contract.service';
import { JwtAuthGuard } from 'src/common/guards/token.guard';
import { ReqDto } from '../token/dto/token.dto';
import { CreateContractDto, SignContractDto } from './dto/contract.dto';

@Controller('contract')
@UseGuards(JwtAuthGuard)
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  /**
   * 合同模板列表
   */
  @Get('templates')
  async getTemplates() {
    return await this.contractService.getTemplates();
  }

  /**
   * 创建合同
   * body: { templateId, fields: { key: value } }
   */
  @Post('create')
  async createContract(
    @Body() body: CreateContractDto,
    @Request() req: ReqDto,
  ) {
    return await this.contractService.createContract(req.user.id, body);
  }

  /**
   * 我的合同列表
   */
  @Get('my')
  async getMyContracts(@Request() req: ReqDto) {
    return await this.contractService.getMyContracts(req.user.id);
  }

  /**
   * 合同详情（含渲染后的 content_html）
   */
  @Get(':id')
  async getContractDetail(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: ReqDto,
  ) {
    return await this.contractService.getContractDetail(id, req.user.id);
  }

  /**
   * 电子签名
   * body: { signatureName }
   */
  @Post(':id/sign')
  async signContract(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SignContractDto,
    @Request() req: ReqDto,
  ) {
    return await this.contractService.signContract(
      id,
      req.user.id,
      body.signatureName,
    );
  }

  /**
   * 删除合同（仅草稿）
   */
  @Delete(':id')
  async deleteContract(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: ReqDto,
  ) {
    return await this.contractService.deleteContract(id, req.user.id);
  }
}
