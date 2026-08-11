import { Module, OnModuleInit } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from '../token/token.module';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractTemplateEntity } from 'src/database/entities/contract_template.entity';
import { seedContractTemplates } from './seed';

/**
 * 数字合约模块
 *
 * 负责认养协议 / 采摘预约协议 / 农产品认购协议 / 农耕体验课报名等
 * 农旅场景合同的创建、渲染、电子签名与查询。
 * 模块初始化时自动插入演示模板种子数据（幂等）。
 */
@Module({
  imports: [DatabaseModule, TokenModule],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule implements OnModuleInit {
  constructor(
    @InjectRepository(ContractTemplateEntity)
    private readonly templateRepo: Repository<ContractTemplateEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await seedContractTemplates(this.templateRepo);
  }
}
