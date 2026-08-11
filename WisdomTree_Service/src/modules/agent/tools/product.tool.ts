import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { TreeTypeEntity } from 'src/database/entities/treeType.entity';
import { AgentTool } from './base.tool';

@Injectable()
export class ProductTool implements AgentTool {
  readonly name = 'product_query';
  readonly description =
    '查询农产品/树木品种信息，包括成熟期、价格、剩余数量、认养能量等';
  readonly parameters = {
    type: 'object',
    properties: {
      product: { type: 'string', description: '产品名称或关键词' },
      aspect: {
        type: 'string',
        description: '查询方面: season(季节), price(价格), all(全部)',
        enum: ['season', 'price', 'all'],
      },
    },
  };

  private readonly logger = new Logger(ProductTool.name);

  constructor(
    @InjectRepository(TreeTypeEntity)
    private readonly treeTypeRepo: Repository<TreeTypeEntity>,
  ) {}

  async execute(params: any, _userId: number): Promise<any> {
    try {
      const keyword = params?.product || '';
      const aspect = params?.aspect || 'all';

      let products;
      if (keyword) {
        // Search by common_name or scientific_name
        products = await this.treeTypeRepo.find({
          where: [
            { common_name: Like(`%${keyword}%`) },
            { scientific_name: Like(`%${keyword}%`) },
          ],
        });
      } else {
        // Return all products
        products = await this.treeTypeRepo.find({
          order: { remaining: 'DESC' },
        });
      }

      if (!products || products.length === 0) {
        return {
          found: false,
          message: keyword
            ? `没有找到"${keyword}"相关的农产品信息`
            : '暂无农产品信息',
          products: [],
        };
      }

      const result = products.map((p) => ({
        id: p.id,
        name: p.common_name,
        scientificName: p.scientific_name,
        description: p.description,
        total: p.total,
        remaining: p.remaining,
        energyRequired: p.energy,
        avatar: p.avatar,
      }));

      return {
        found: true,
        count: result.length,
        products: result,
        message: `找到 ${result.length} 个相关产品`,
      };
    } catch (error) {
      this.logger.error(`ProductTool error: ${error.message}`);
      return {
        found: false,
        message: '查询产品信息时出错，请稍后再试',
        products: [],
        error: error.message,
      };
    }
  }
}
