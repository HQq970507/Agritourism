import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import dayjs from 'dayjs';
import { AdoptionsEntity } from 'src/database/entities/adoptions.entity';
import { ProductEntity } from 'src/database/entities/products.entity';
import { ContractTemplateEntity } from 'src/database/entities/contract_template.entity';
import { ContractEntity } from 'src/database/entities/contract.entity';
import { GrowthDiaryEntity } from 'src/database/entities/growth_diary.entity';
import { TraceabilityEntity } from 'src/database/entities/traceability.entity';
import { ContractService } from '../contract/contract.service';
import { TraceabilityService } from '../traceability/traceability.service';
import { PointsService } from '../points/points.service';
import {
  CreateAdoptionDto,
  CreateDiaryDto,
  PickupHarvestDto,
  ShipHarvestDto,
} from './dto/adoption.dto';
import { ApiResponse } from 'src/common/interfaces/res.interface';

/** 认领成功奖励积分 */
const ADOPTION_POINTS = 50;
/** 写日记奖励积分 */
const DIARY_POINTS = 1;
/** 认养协议模板编码 */
const ADOPTION_TEMPLATE_CODE = 'adoption';

@Injectable()
export class AdoptionService {
  constructor(
    @InjectRepository(AdoptionsEntity)
    private readonly adoptionRepo: Repository<AdoptionsEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(ContractTemplateEntity)
    private readonly templateRepo: Repository<ContractTemplateEntity>,
    @InjectRepository(GrowthDiaryEntity)
    private readonly diaryRepo: Repository<GrowthDiaryEntity>,
    private readonly contractService: ContractService,
    private readonly traceabilityService: TraceabilityService,
    private readonly pointsService: PointsService,
  ) {}

  /**
   * 认领下单
   * 事务内联动完成 4 件事 + 日记初始化：
   * ① 创建认领记录 ② 自动生成认养合约（draft 草约） ③ 生成溯源码并建档（stage=planting）
   * ④ 用户积分 +50，并预置一条 stage=seedling 的初始化生长日记。
   */
  async createAdoption(
    userId: number,
    dto: CreateAdoptionDto,
  ): Promise<ApiResponse> {
    // 事务外先校验产品与认养模板，避免开启无效事务
    // 支持两种认领方式：categoryId（按分类，前端产品列表传分类 id）或 productId（直接指定产品实例）
    const product = await this.resolveProduct(dto);
    if (!product) {
      throw new HttpException('产品不存在或该分类暂无产品', HttpStatus.NOT_FOUND);
    }
    if (product.adoptable === false) {
      throw new HttpException('该产品暂不支持认领', HttpStatus.BAD_REQUEST);
    }

    const template = await this.templateRepo.findOne({
      where: { code: ADOPTION_TEMPLATE_CODE, is_active: true },
    });
    if (!template) {
      throw new HttpException(
        '认养协议模板不存在，请先初始化合同模板',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const category = product.category;
    const productName = category?.display_name || category?.name || `产品${product.id}`;
    const productType = category?.name || '农旅产品';

    let createdContract: ContractEntity | null = null;
    let traceCode: string | null = null;

    try {
      await this.adoptionRepo.manager.transaction(async (manager) => {
        // ② 自动生成认养合约（draft 草约，复用"认养协议"模板）
        const contractRes = await this.contractService.createContract(userId, {
          templateId: template.id,
          fields: {
            productName,
            productType,
            quantity: '1',
            term: '一年',
          },
        });
        createdContract = contractRes.data;

        // ③ 生成溯源码并建档（stage=planting；认领无订单，order_id 传 null）
        traceCode = await this.traceabilityService.generateTraceCode(
          null,
          product.id,
        );

        // ④ 用户积分 +50（与认领同事务）
        await this.pointsService.addPoints(
          userId,
          ADOPTION_POINTS,
          'adoption',
          undefined,
          manager,
        );

        // ① 创建认领记录
        const adoptionId = await this.generateAdoptionId(manager);
        const adoption = await manager.getRepository(AdoptionsEntity).save({
          adoption_id: adoptionId,
          nickname: dto.nickname || '',
          area: dto.area || '',
          wish: dto.wish || '',
          status: 'growing',
          trace_code: traceCode,
          user: { id: userId },
          product: { id: product.id },
          contract: { id: createdContract.id },
        });

        // 日记初始化：预置一条 stage=seedling 的初始化日记
        await manager.getRepository(GrowthDiaryEntity).save({
          product_name: productName,
          stage: 'seedling',
          day_count: 0,
          description: `🎉 认领成功！你的${productName}开始生长啦`,
          user: { id: userId },
          adoption: { id: adoption.id },
        });
      });
    } catch (error) {
      // 合约与溯源台账由各自 Service 写入（独立于本事务），失败时补偿清理
      if (createdContract) {
        await this.adoptionRepo.manager
          .getRepository(ContractEntity)
          .delete({ id: createdContract.id })
          .catch(() => undefined);
      }
      if (traceCode) {
        await this.adoptionRepo.manager
          .getRepository(TraceabilityEntity)
          .delete({ trace_code: traceCode })
          .catch(() => undefined);
      }
      if (error instanceof HttpException) {
        throw error;
      }
      console.log(error);
      throw new HttpException('认领失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '认领成功',
      data: {
        traceCode,
        productName,
        contractId: createdContract.id,
      },
    };
  }

  /**
   * 我的认领列表（含产品名/图片/状态/合约/溯源码/日记数）
   */
  async getMyAdoptions(userId: number): Promise<ApiResponse> {
    const adoptions = await this.adoptionRepo.find({
      where: { user: { id: userId } },
      relations: ['product', 'product.category', 'product.media', 'contract'],
      order: { id: 'DESC' },
    });

    const diaryCounts = await this.getDiaryCounts(userId);

    const data = adoptions.map((a) => {
      const category = a.product?.category;
      const media = Array.isArray(a.product?.media) ? a.product.media : [];
      return {
        id: a.id,
        adoption_id: a.adoption_id,
        productId: a.product?.id ?? null,
        productName: category?.display_name || category?.name || '',
        productImage: media.length > 0 ? media[0].media_url : '',
        status: a.status,
        area: a.area,
        wish: a.wish,
        nickname: a.nickname,
        contractId: a.contract?.id ?? null,
        contractStatus: a.contract?.status ?? null,
        traceCode: a.trace_code,
        harvest_type: a.harvest_type ?? null,
        harvest_info: a.harvest_info ?? null,
        diaryCount: diaryCounts.get(a.id) ?? 0,
        adoptedAt: a.adopted_at,
      };
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data,
    };
  }

  /**
   * 认领详情（仅本人可见）
   */
  async getAdoptionDetail(
    adoptionId: number,
    userId: number,
  ): Promise<ApiResponse> {
    const adoption = await this.adoptionRepo.findOne({
      where: { id: adoptionId, user: { id: userId } },
      relations: ['product', 'product.category', 'product.media', 'contract'],
    });
    if (!adoption) {
      throw new HttpException('认领记录不存在', HttpStatus.NOT_FOUND);
    }

    const category = adoption.product?.category;
    const media = Array.isArray(adoption.product?.media)
      ? adoption.product.media
      : [];
    const diaryCount = await this.diaryRepo.count({
      where: { adoption: { id: adoption.id } },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: {
        id: adoption.id,
        adoption_id: adoption.adoption_id,
        productId: adoption.product?.id ?? null,
        productName: category?.display_name || category?.name || '',
        productImage: media.length > 0 ? media[0].media_url : '',
        productPrice: adoption.product?.price ?? 0,
        adoptPrice: adoption.product?.adopt_price ?? 0,
        unit: category?.unit ?? '',
        status: adoption.status,
        area: adoption.area,
        wish: adoption.wish,
        nickname: adoption.nickname,
        contractId: adoption.contract?.id ?? null,
        contractStatus: adoption.contract?.status ?? null,
        traceCode: adoption.trace_code,
        harvest_type: adoption.harvest_type ?? null,
        harvest_info: adoption.harvest_info ?? null,
        diaryCount,
        adoptedAt: adoption.adopted_at,
      },
    };
  }

  /**
   * 预约采摘
   * 仅 growing 状态可预约（→ harvesting），采摘信息记录到 harvest_info。
   */
  async pickupHarvest(
    adoptionId: number,
    userId: number,
    dto: PickupHarvestDto,
  ): Promise<ApiResponse> {
    const adoption = await this.adoptionRepo.findOne({
      where: { id: adoptionId, user: { id: userId } },
    });
    if (!adoption) {
      throw new HttpException('认领记录不存在', HttpStatus.NOT_FOUND);
    }
    this.assertHarvestable(adoption, 'pickup');

    const harvestInfo = {
      pickupDate: dto.pickupDate,
      pickupTime: dto.pickupTime ?? null,
      partySize: dto.partySize ?? null,
      contactName: dto.contactName ?? (adoption.nickname || ''),
      contactPhone: dto.contactPhone ?? null,
    };

    await this.adoptionRepo.manager.transaction(async (manager) => {
      await manager.update(
        AdoptionsEntity,
        { id: adoption.id },
        {
          status: 'harvesting',
          harvest_type: 'pickup',
          harvest_info: harvestInfo,
        },
      );
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '预约采摘成功，请按约定时间到园采摘',
      data: {
        adoptionId: adoption.id,
        status: 'harvesting',
        message: '预约采摘成功，请按约定时间到园采摘',
      },
    };
  }

  /**
   * 邮寄到家
   * 仅 growing 状态可邮寄（→ completed），收货信息记录到 harvest_info。
   */
  async shipHarvest(
    adoptionId: number,
    userId: number,
    dto: ShipHarvestDto,
  ): Promise<ApiResponse> {
    const adoption = await this.adoptionRepo.findOne({
      where: { id: adoptionId, user: { id: userId } },
    });
    if (!adoption) {
      throw new HttpException('认领记录不存在', HttpStatus.NOT_FOUND);
    }
    this.assertHarvestable(adoption, 'ship');

    const harvestInfo = {
      address: dto.address,
      receiverName: dto.receiverName,
      receiverPhone: dto.receiverPhone ?? null,
      shipMethod: dto.shipMethod ?? '顺丰',
      remark: dto.remark ?? null,
    };

    await this.adoptionRepo.manager.transaction(async (manager) => {
      await manager.update(
        AdoptionsEntity,
        { id: adoption.id },
        {
          status: 'completed',
          harvest_type: 'ship',
          harvest_info: harvestInfo,
        },
      );
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '邮寄到家申请成功',
      data: {
        adoptionId: adoption.id,
        status: 'completed',
        message: '邮寄到家申请成功',
      },
    };
  }

  /**
   * 查询收获状态
   */
  async getHarvestStatus(
    adoptionId: number,
    userId: number,
  ): Promise<ApiResponse> {
    const adoption = await this.adoptionRepo.findOne({
      where: { id: adoptionId, user: { id: userId } },
    });
    if (!adoption) {
      throw new HttpException('认领记录不存在', HttpStatus.NOT_FOUND);
    }

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: {
        adoptionId: adoption.id,
        status: adoption.status,
        harvestInfo: adoption.harvest_type
          ? { type: adoption.harvest_type, detail: adoption.harvest_info ?? {} }
          : { type: null, detail: {} },
      },
    };
  }

  /**
   * 校验收获动作是否可执行（幂等）
   * growing → pickup 可预约采摘；growing → ship 可邮寄到家；
   * harvesting 再邮寄返回 400「请先完成采摘」；completed 任何操作返回 400「已收获完成」。
   */
  private assertHarvestable(
    adoption: AdoptionsEntity,
    action: 'pickup' | 'ship',
  ): void {
    if (adoption.status === 'completed') {
      throw new HttpException('已收获完成', HttpStatus.BAD_REQUEST);
    }
    if (adoption.status === 'harvesting') {
      throw new HttpException('请先完成采摘', HttpStatus.BAD_REQUEST);
    }
    if (adoption.status !== 'growing') {
      throw new HttpException(
        `当前状态不可${action === 'pickup' ? '预约采摘' : '邮寄到家'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 写日记（+1 积分，与日记保存同事务）
   */
  async createDiary(
    adoptionId: number,
    userId: number,
    dto: CreateDiaryDto,
  ): Promise<ApiResponse> {
    const adoption = await this.adoptionRepo.findOne({
      where: { id: adoptionId, user: { id: userId } },
      relations: ['product', 'product.category'],
    });
    if (!adoption) {
      throw new HttpException('认领记录不存在', HttpStatus.NOT_FOUND);
    }

    const category = adoption.product?.category;
    const productName = category?.display_name || category?.name || '';

    const diary = await this.adoptionRepo.manager.transaction(async (manager) => {
      // 认养天数：在已有日记最大 day_count 基础上 +1
      const last = await manager.getRepository(GrowthDiaryEntity).findOne({
        where: { adoption: { id: adoptionId } },
        order: { day_count: 'DESC', id: 'DESC' },
      });
      const dayCount = last ? last.day_count + 1 : 1;

      const saved = await manager.getRepository(GrowthDiaryEntity).save({
        product_name: productName,
        stage: dto.stage,
        day_count: dayCount,
        description: dto.description,
        temperature: dto.temperature ?? null,
        humidity: dto.humidity ?? null,
        media_url: dto.mediaUrl ?? null,
        user: { id: userId },
        adoption: { id: adoptionId },
      });

      // 写日记 +1 积分
      await this.pointsService.addPoints(
        userId,
        DIARY_POINTS,
        'diary',
        undefined,
        manager,
      );

      return saved;
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '日记发布成功，积分+1',
      data: diary,
    };
  }

  /**
   * 该认领的日记列表（时间线顺序）
   */
  async getDiaries(adoptionId: number, userId: number): Promise<ApiResponse> {
    const adoption = await this.adoptionRepo.findOne({
      where: { id: adoptionId, user: { id: userId } },
    });
    if (!adoption) {
      throw new HttpException('认领记录不存在', HttpStatus.NOT_FOUND);
    }

    const diaries = await this.diaryRepo.find({
      where: { adoption: { id: adoptionId } },
      order: { id: 'ASC' },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: diaries,
    };
  }

  /**
   * 每个认领记录的日记条数统计
   */
  private async getDiaryCounts(userId: number): Promise<Map<number, number>> {
    const rows = await this.diaryRepo
      .createQueryBuilder('diary')
      .select('diary.adoption_id', 'adoptionId')
      .addSelect('COUNT(*)', 'count')
      .where('diary.user_id = :userId', { userId })
      .andWhere('diary.adoption_id IS NOT NULL')
      .groupBy('diary.adoption_id')
      .getRawMany();

    const map = new Map<number, number>();
    for (const row of rows) {
      map.set(Number(row.adoptionId), Number(row.count));
    }
    return map;
  }

  /**
   * 生成唯一认领编号：AD + YYYYMMDDHHmmss + 4位随机数
   */
  private async generateAdoptionId(manager: EntityManager): Promise<string> {
    const repo = manager.getRepository(AdoptionsEntity);
    for (let i = 0; i < 10; i++) {
      const datePart = dayjs().format('YYYYMMDDHHmmss');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const id = `AD${datePart}${randomPart}`;
      const existing = await repo.findOne({ where: { adoption_id: id } });
      if (!existing) {
        return id;
      }
    }
    throw new HttpException('认领编号生成失败，请重试', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  /**
   * 解析认领目标产品：优先 categoryId 按分类选产品实例，其次 productId 直接指定
   */
  private async resolveProduct(dto: CreateAdoptionDto): Promise<ProductEntity | null> {
    if (dto.categoryId) {
      return await this.productRepo.findOne({
        where: { category: { id: dto.categoryId }, is_sold: false },
        relations: ['category', 'media'],
        order: { id: 'ASC' },
      });
    }
    if (dto.productId) {
      return await this.productRepo.findOne({
        where: { id: dto.productId },
        relations: ['category', 'media'],
      });
    }
    return null;
  }
}
