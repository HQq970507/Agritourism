import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdoptionsEntity } from 'src/database/entities/adoptions.entity';
import { AgentTool } from './base.tool';

@Injectable()
export class OrderTool implements AgentTool {
  readonly name = 'order_query';
  readonly description =
    '查询用户的认养/订单记录，包括认养编号、树木名称、认养时间等';
  readonly parameters = {
    type: 'object',
    properties: {
      orderId: { type: 'string', description: '认养编号（可选，留空查全部）' },
    },
  };

  private readonly logger = new Logger(OrderTool.name);

  constructor(
    @InjectRepository(AdoptionsEntity)
    private readonly adoptionRepo: Repository<AdoptionsEntity>,
  ) {}

  async execute(params: any, userId: number): Promise<any> {
    try {
      const orderId = params?.orderId || null;

      let orders;
      if (orderId) {
        // Query specific order by adoption_id AND user ownership
        orders = await this.adoptionRepo.find({
          where: { adoption_id: orderId, user: { id: userId } },
          relations: ['type_id', 'tree'],
          order: { adopted_at: 'DESC' },
        });
      } else {
        // Query all orders for this user
        orders = await this.adoptionRepo.find({
          where: { user: { id: userId } },
          relations: ['type_id', 'tree'],
          order: { adopted_at: 'DESC' },
          take: 20,
        });
      }

      if (!orders || orders.length === 0) {
        return {
          found: false,
          message: orderId
            ? `没有找到编号为"${orderId}"的认养记录`
            : '您还没有认养记录，去认养一棵树吧！',
          orders: [],
        };
      }

      const result = orders.map((o) => ({
        adoptionId: o.adoption_id,
        nickname: o.nickname,
        treeType: o.tree_type,
        area: o.area,
        wish: o.wish,
        adoptedAt: o.adopted_at,
        treeSpecies: o.type_id?.common_name || null,
      }));

      return {
        found: true,
        count: result.length,
        orders: result,
        message: `找到 ${result.length} 条认养记录`,
      };
    } catch (error) {
      this.logger.error(`OrderTool error: ${error.message}`);
      return {
        found: false,
        message: '查询认养记录时出错，请稍后再试',
        orders: [],
        error: error.message,
      };
    }
  }
}
