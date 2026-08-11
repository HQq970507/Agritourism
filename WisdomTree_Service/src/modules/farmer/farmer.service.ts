import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import dayjs from 'dayjs';
import AdminUserEntity from 'src/database/entities/adminUser.entity';
import { ProductCategoryEntity } from 'src/database/entities/product_categories.entity';
import { ProductEntity } from 'src/database/entities/products.entity';
import { AdoptionsEntity } from 'src/database/entities/adoptions.entity';
import { GrowthDiaryEntity } from 'src/database/entities/growth_diary.entity';
import { ApiResponse } from 'src/common/interfaces/res.interface';
import { UpdateFarmerProfileDto } from './dto/farmer.dto';

/** 平台分成后农户所得比例 */
const FARMER_SHARE_RATE = 0.85;
/** 平台分成比例 */
const PLATFORM_SHARE_RATE = 0.15;

interface RevenueItem {
  adoptionId: number;
  adoptionNo: string;
  productName: string;
  adoptPrice: number;
  farmerShare: number;
  date: Date;
}

interface RevenueSummary {
  totalOrders: number;
  totalRevenue: number;
  platformShare: number;
  list: RevenueItem[];
}

@Injectable()
export class FarmerService {
  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly adminRepo: Repository<AdminUserEntity>,
    @InjectRepository(ProductCategoryEntity)
    private readonly categoryRepo: Repository<ProductCategoryEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(AdoptionsEntity)
    private readonly adoptionRepo: Repository<AdoptionsEntity>,
    @InjectRepository(GrowthDiaryEntity)
    private readonly diaryRepo: Repository<GrowthDiaryEntity>,
  ) {}

  // 农户信息
  async getProfile(farmerId: number): Promise<ApiResponse> {
    const farmer = await this.getFarmerOrThrow(farmerId);
    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: this.formatProfile(farmer),
    };
  }

  // 更新农户信息
  async updateProfile(
    farmerId: number,
    dto: UpdateFarmerProfileDto,
  ): Promise<ApiResponse> {
    await this.getFarmerOrThrow(farmerId);

    const updateData: Partial<AdminUserEntity> = {};
    if (dto.farmName !== undefined) updateData.farm_name = dto.farmName;
    if (dto.qualification !== undefined)
      updateData.qualification = dto.qualification;
    if (dto.phone !== undefined) updateData.phone = dto.phone;

    await this.adminRepo.update({ id: farmerId }, updateData);

    const farmer = await this.getFarmerOrThrow(farmerId);
    return {
      status: HttpStatus.OK,
      code: 0,
      message: '更新成功',
      data: this.formatProfile(farmer),
    };
  }

  // 我名下产品分类列表（含认领产品数）
  async getMyProducts(farmerId: number): Promise<ApiResponse> {
    const categories = await this.categoryRepo.find({
      where: { farmer_id: farmerId },
      order: { id: 'ASC' },
    });

    if (categories.length === 0) {
      return {
        status: HttpStatus.OK,
        code: 0,
        message: '获取成功',
        data: [],
      };
    }

    const ids = categories.map((c) => c.id);

    const adoptionRows = await this.adoptionRepo
      .createQueryBuilder('a')
      .innerJoin('a.product', 'p')
      .select('p.category_id', 'categoryId')
      .addSelect('COUNT(*)', 'count')
      .where('p.category_id IN (:...ids)', { ids })
      .groupBy('p.category_id')
      .getRawMany();

    const adoptableRows = await this.productRepo
      .createQueryBuilder('p')
      .select('p.category_id', 'categoryId')
      .addSelect('COUNT(*)', 'count')
      .where('p.category_id IN (:...ids)', { ids })
      .andWhere('p.is_sold = :sold', { sold: false })
      .andWhere('p.adoptable = :adoptable', { adoptable: true })
      .groupBy('p.category_id')
      .getRawMany();

    const adoptionMap = new Map<number, number>();
    for (const row of adoptionRows) {
      adoptionMap.set(Number(row.categoryId), Number(row.count));
    }
    const adoptableMap = new Map<number, number>();
    for (const row of adoptableRows) {
      adoptableMap.set(Number(row.categoryId), Number(row.count));
    }

    const data = categories.map((c) => ({
      id: c.id,
      name: c.name,
      display_name: c.display_name,
      price: Number(c.price),
      unit: c.unit,
      total: c.total,
      remaining: c.remaining,
      points_required: c.points_required,
      adoptable: (adoptableMap.get(c.id) ?? 0) > 0,
      adoptionCount: adoptionMap.get(c.id) ?? 0,
    }));

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data,
    };
  }

  // 我名下认领订单列表
  async getMyAdoptions(
    farmerId: number,
    status?: string,
  ): Promise<ApiResponse> {
    const adoptions = await this.buildFarmerAdoptionQuery(
      farmerId,
      status,
    ).getMany();

    const diaryCounts = await this.getDiaryCounts(adoptions);

    const data = adoptions.map((a) => {
      const category = a.product?.category;
      return {
        id: a.id,
        adoption_id: a.adoption_id,
        productName:
          category?.display_name || category?.name || '未知产品',
        status: a.status,
        nickname: a.nickname,
        wish: a.wish,
        area: a.area,
        adopted_at: a.adopted_at,
        trace_code: a.trace_code,
        harvest_type: a.harvest_type ?? null,
        diaryCount: diaryCounts.get(a.id) ?? 0,
      };
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data,
    };
  }

  // 确认认领单（growing → confirmed）
  async confirmAdoption(
    farmerId: number,
    adoptionId: number,
  ): Promise<ApiResponse> {
    const adoption = await this.findFarmerAdoption(farmerId, adoptionId);
    if (adoption.status !== 'growing') {
      throw new HttpException('当前状态不可确认', HttpStatus.BAD_REQUEST);
    }

    await this.adoptionRepo.update(
      { id: adoption.id },
      { status: 'confirmed' },
    );

    const updated = await this.findFarmerAdoption(farmerId, adoptionId);
    return {
      status: HttpStatus.OK,
      code: 0,
      message: '确认成功',
      data: this.formatAdoption(updated),
    };
  }

  // 履约完成（growing / confirmed → completed）
  async completeAdoption(
    farmerId: number,
    adoptionId: number,
  ): Promise<ApiResponse> {
    const adoption = await this.findFarmerAdoption(farmerId, adoptionId);
    if (adoption.status === 'completed') {
      throw new HttpException('已履约完成', HttpStatus.BAD_REQUEST);
    }
    if (adoption.status !== 'growing' && adoption.status !== 'confirmed') {
      throw new HttpException('当前状态不可履约完成', HttpStatus.BAD_REQUEST);
    }

    await this.adoptionRepo.update(
      { id: adoption.id },
      { status: 'completed' },
    );

    const updated = await this.findFarmerAdoption(farmerId, adoptionId);
    return {
      status: HttpStatus.OK,
      code: 0,
      message: '履约完成',
      data: this.formatAdoption(updated),
    };
  }

  // 收益中心
  async getRevenue(farmerId: number): Promise<ApiResponse> {
    const adoptions = await this.buildFarmerAdoptionQuery(farmerId).getMany();
    const revenue = this.computeRevenue(adoptions);
    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: revenue,
    };
  }

  // 数据看板
  async getDashboard(farmerId: number): Promise<ApiResponse> {
    const adoptions = await this.buildFarmerAdoptionQuery(farmerId).getMany();

    const totalAdoptions = adoptions.length;
    const growingCount = adoptions.filter(
      (a) => a.status === 'growing',
    ).length;
    const completedCount = adoptions.filter(
      (a) => a.status === 'completed',
    ).length;

    const diaryCounts = await this.getDiaryCounts(adoptions);
    const totalDiaries = Array.from(diaryCounts.values()).reduce(
      (sum, n) => sum + n,
      0,
    );

    const revenueTotal = this.computeRevenue(adoptions).totalRevenue;

    const trendMap = new Map<string, number>();
    for (const a of adoptions) {
      const key = dayjs(a.adopted_at).format('YYYY-MM-DD');
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }
    const recentTrend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const key = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      recentTrend.push({ date: key, count: trendMap.get(key) ?? 0 });
    }

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: {
        totalAdoptions,
        growingCount,
        completedCount,
        totalDiaries,
        revenueTotal,
        recentTrend,
      },
    };
  }

  // 校验农户账号存在且角色为 farmer
  private async getFarmerOrThrow(farmerId: number): Promise<AdminUserEntity> {
    const farmer = await this.adminRepo.findOne({
      where: { id: farmerId },
    });
    if (!farmer || farmer.role !== 'farmer') {
      throw new HttpException('农户账号不存在', HttpStatus.NOT_FOUND);
    }
    return farmer;
  }

  // 农户信息输出
  private formatProfile(farmer: AdminUserEntity) {
    return {
      id: farmer.id,
      username: farmer.username,
      role: farmer.role,
      status: farmer.status,
      farmName: farmer.farm_name ?? null,
      qualification: farmer.qualification ?? null,
      phone: farmer.phone ?? null,
      createdAt: farmer.created_at,
    };
  }

  // 认领单基础查询：join product → category，限定 farmer_id
  private buildFarmerAdoptionQuery(farmerId: number, status?: string) {
    const qb = this.adoptionRepo
      .createQueryBuilder('a')
      .innerJoin('a.product', 'p')
      .innerJoin('p.category', 'c')
      .leftJoinAndSelect('a.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .where('c.farmer_id = :farmerId', { farmerId })
      .orderBy('a.id', 'DESC');
    if (status) {
      qb.andWhere('a.status = :status', { status });
    }
    return qb;
  }

  // 校验认领单归属当前农户
  private async findFarmerAdoption(
    farmerId: number,
    adoptionId: number,
  ): Promise<AdoptionsEntity> {
    const adoption = await this.buildFarmerAdoptionQuery(farmerId)
      .andWhere('a.id = :id', { id: adoptionId })
      .getOne();
    if (!adoption) {
      throw new HttpException('认领记录不存在', HttpStatus.NOT_FOUND);
    }
    return adoption;
  }

  // 认领单输出（状态更新后返回）
  private formatAdoption(adoption: AdoptionsEntity) {
    const category = adoption.product?.category;
    return {
      id: adoption.id,
      adoption_id: adoption.adoption_id,
      productName: category?.display_name || category?.name || '未知产品',
      status: adoption.status,
      nickname: adoption.nickname,
      wish: adoption.wish,
      area: adoption.area,
      adopted_at: adoption.adopted_at,
      trace_code: adoption.trace_code,
      harvest_type: adoption.harvest_type ?? null,
    };
  }

  // 每个认领记录的日记条数
  private async getDiaryCounts(
    adoptions: AdoptionsEntity[],
  ): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    if (adoptions.length === 0) return map;

    const ids = adoptions.map((a) => a.id);
    const rows = await this.diaryRepo
      .createQueryBuilder('d')
      .select('d.adoption_id', 'adoptionId')
      .addSelect('COUNT(*)', 'count')
      .where('d.adoption_id IN (:...ids)', { ids })
      .groupBy('d.adoption_id')
      .getRawMany();

    for (const row of rows) {
      map.set(Number(row.adoptionId), Number(row.count));
    }
    return map;
  }

  // 收益汇总：adoptPrice 取产品认领价，为 0 时用分类单价 ×0.85 兜底；
  // 农户所得 = 认领价 ×0.85，平台分成 = 认领价 ×0.15
  private computeRevenue(adoptions: AdoptionsEntity[]): RevenueSummary {
    let totalRevenue = 0;
    let platformShare = 0;

    const list: RevenueItem[] = adoptions.map((a) => {
      const category = a.product?.category;
      const rawAdopt = Number(a.product?.adopt_price ?? 0);
      const rawPrice = Number(category?.price ?? 0);
      const adoptPrice =
        rawAdopt > 0
          ? rawAdopt
          : rawPrice > 0
            ? this.round2(rawPrice * 0.85)
            : 0;
      const farmerShare = this.round2(adoptPrice * FARMER_SHARE_RATE);
      totalRevenue = this.round2(totalRevenue + farmerShare);
      platformShare = this.round2(
        platformShare + adoptPrice * PLATFORM_SHARE_RATE,
      );
      return {
        adoptionId: a.id,
        adoptionNo: a.adoption_id,
        productName:
          category?.display_name || category?.name || '未知产品',
        adoptPrice,
        farmerShare,
        date: a.adopted_at,
      };
    });

    return {
      totalOrders: list.length,
      totalRevenue,
      platformShare,
      list,
    };
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
