import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import dayjs from 'dayjs';
import AdminUserEntity from 'src/database/entities/adminUser.entity';
import { ProductCategoryEntity } from 'src/database/entities/product_categories.entity';
import { AdoptionsEntity } from 'src/database/entities/adoptions.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { ApiResponse } from 'src/common/interfaces/res.interface';

/** 平台分成后农户所得比例（收益口径与 P3 一致） */
const FARMER_SHARE_RATE = 0.85;

@Injectable()
export class GovernmentService {
  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly adminRepo: Repository<AdminUserEntity>,
    @InjectRepository(ProductCategoryEntity)
    private readonly categoryRepo: Repository<ProductCategoryEntity>,
    @InjectRepository(AdoptionsEntity)
    private readonly adoptionRepo: Repository<AdoptionsEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  // 农户监管列表（含名下认领单数与产品分类数）
  async getFarmers(status?: string): Promise<ApiResponse> {
    const qb = this.adminRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: 'farmer' })
      .orderBy('u.id', 'ASC');
    if (status) {
      qb.andWhere('u.status = :status', { status });
    }
    const farmers = await qb.getMany();

    if (farmers.length === 0) {
      return {
        status: HttpStatus.OK,
        code: 0,
        message: '获取成功',
        data: [],
      };
    }

    const ids = farmers.map((f) => f.id);

    const adoptionRows = await this.adoptionRepo
      .createQueryBuilder('a')
      .innerJoin('a.product', 'p')
      .innerJoin('p.category', 'c')
      .select('c.farmer_id', 'farmerId')
      .addSelect('COUNT(*)', 'count')
      .where('c.farmer_id IN (:...ids)', { ids })
      .groupBy('c.farmer_id')
      .getRawMany();

    const categoryRows = await this.categoryRepo
      .createQueryBuilder('c')
      .select('c.farmer_id', 'farmerId')
      .addSelect('COUNT(*)', 'count')
      .where('c.farmer_id IN (:...ids)', { ids })
      .groupBy('c.farmer_id')
      .getRawMany();

    const adoptionMap = new Map<number, number>();
    for (const row of adoptionRows) {
      adoptionMap.set(Number(row.farmerId), Number(row.count));
    }
    const categoryMap = new Map<number, number>();
    for (const row of categoryRows) {
      categoryMap.set(Number(row.farmerId), Number(row.count));
    }

    const data = farmers.map((f) => ({
      id: f.id,
      username: f.username,
      farm_name: f.farm_name ?? null,
      qualification: f.qualification ?? null,
      phone: f.phone ?? null,
      status: f.status,
      created_at: f.created_at,
      productAdoptions: adoptionMap.get(f.id) ?? 0,
      productCount: categoryMap.get(f.id) ?? 0,
    }));

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data,
    };
  }

  // 审核/封禁农户
  async updateFarmerStatus(id: number, status: string): Promise<ApiResponse> {
    const farmer = await this.adminRepo.findOne({ where: { id } });
    if (!farmer || farmer.role !== 'farmer') {
      throw new HttpException('农户账号不存在', HttpStatus.NOT_FOUND);
    }

    await this.adminRepo.update({ id: farmer.id }, { status });

    const updated = await this.adminRepo.findOneOrFail({
      where: { id: farmer.id },
    });
    return {
      status: HttpStatus.OK,
      code: 0,
      message: status === 'banned' ? '已封禁' : '已通过审核',
      data: this.formatFarmer(updated),
    };
  }

  // 全区产品监管列表（可按农户筛选）
  async getProducts(farmerId?: number): Promise<ApiResponse> {
    const qb = this.categoryRepo
      .createQueryBuilder('c')
      .leftJoin('admin_user', 'u', 'u.id = c.farmer_id')
      .select('c.id', 'id')
      .addSelect('c.display_name', 'display_name')
      .addSelect('c.name', 'name')
      .addSelect('c.farmer_id', 'farmer_id')
      .addSelect('u.farm_name', 'farm_name')
      .addSelect('c.price', 'price')
      .addSelect('c.unit', 'unit')
      .addSelect('c.total', 'total')
      .addSelect('c.remaining', 'remaining')
      .addSelect('c.points_required', 'points_required')
      .addSelect('c.status', 'status')
      .orderBy('c.id', 'ASC');
    if (farmerId !== undefined) {
      qb.where('c.farmer_id = :farmerId', { farmerId });
    }

    const rows = await qb.getRawMany();
    if (rows.length === 0) {
      return {
        status: HttpStatus.OK,
        code: 0,
        message: '获取成功',
        data: [],
      };
    }

    const ids = rows.map((r) => Number(r.id));
    const adoptRows = await this.productAdoptPriceRows(ids);
    const adoptMap = new Map<number, number>();
    for (const row of adoptRows) {
      adoptMap.set(Number(row.categoryId), Number(row.maxAdopt));
    }

    const data = rows.map((r) => {
      const price = Number(r.price);
      const maxAdopt = adoptMap.get(Number(r.id)) ?? 0;
      const adoptPrice = maxAdopt > 0 ? maxAdopt : this.round2(price * FARMER_SHARE_RATE);
      return {
        id: Number(r.id),
        display_name: r.display_name,
        name: r.name,
        farmer_id: r.farmer_id !== null ? Number(r.farmer_id) : null,
        farm_name: r.farm_name ?? null,
        price,
        unit: r.unit,
        total: Number(r.total),
        remaining: Number(r.remaining),
        points_required: Number(r.points_required),
        adopt_price: adoptPrice,
        status: r.status ?? 'on',
      };
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data,
    };
  }

  // 下架产品分类
  async offShelfProduct(id: number): Promise<ApiResponse> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new HttpException('产品分类不存在', HttpStatus.NOT_FOUND);
    }
    if (category.status === 'off') {
      throw new HttpException('该产品已下架', HttpStatus.BAD_REQUEST);
    }

    await this.categoryRepo.update({ id: category.id }, { status: 'off' });

    const updated = await this.categoryRepo.findOneOrFail({
      where: { id: category.id },
    });
    return {
      status: HttpStatus.OK,
      code: 0,
      message: '已下架',
      data: {
        id: updated.id,
        display_name: updated.display_name,
        name: updated.name,
        farmer_id: updated.farmer_id ?? null,
        price: Number(updated.price),
        unit: updated.unit,
        total: updated.total,
        remaining: updated.remaining,
        points_required: updated.points_required,
        status: updated.status,
      },
    };
  }

  // 区域报告：按认领区域（市）汇总
  async getRegionReport(): Promise<ApiResponse> {
    const adoptions = await this.loadAllAdoptions();

    const cityMap = new Map<
      string,
      {
        totalAdoptions: number;
        totalRevenue: number;
        completedCount: number;
        activeCount: number;
      }
    >();

    for (const a of adoptions) {
      const city = (a.area ?? '').trim() || '未填写';
      const entry = cityMap.get(city) ?? {
        totalAdoptions: 0,
        totalRevenue: 0,
        completedCount: 0,
        activeCount: 0,
      };
      const adoptPrice = this.resolveAdoptPrice(a);
      entry.totalAdoptions += 1;
      entry.totalRevenue = this.round2(
        entry.totalRevenue + adoptPrice * FARMER_SHARE_RATE,
      );
      if (a.status === 'completed') {
        entry.completedCount += 1;
      } else {
        entry.activeCount += 1;
      }
      cityMap.set(city, entry);
    }

    const data = Array.from(cityMap.entries()).map(([city, v]) => ({
      city,
      totalAdoptions: v.totalAdoptions,
      totalRevenue: v.totalRevenue,
      completedCount: v.completedCount,
      activeCount: v.activeCount,
    }));
    data.sort(
      (x, y) => y.totalAdoptions - x.totalAdoptions || x.city.localeCompare(y.city),
    );

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data,
    };
  }

  // 总览
  async getOverview(): Promise<ApiResponse> {
    const [totalFarmers, totalCategories, totalAdoptions, totalUsers] =
      await Promise.all([
        this.adminRepo.count({ where: { role: 'farmer' } }),
        this.categoryRepo.count(),
        this.adoptionRepo.count(),
        this.userRepo.count(),
      ]);

    const adoptions = await this.loadAllAdoptions();
    let totalRevenue = 0;
    const trendMap = new Map<string, number>();
    for (const a of adoptions) {
      const adoptPrice = this.resolveAdoptPrice(a);
      totalRevenue = this.round2(
        totalRevenue + adoptPrice * FARMER_SHARE_RATE,
      );
      const key = dayjs(a.adopted_at).format('YYYY-MM-DD');
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }

    const trend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const key = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      trend.push({ date: dayjs(key).format('MM-DD'), count: trendMap.get(key) ?? 0 });
    }

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: {
        totalFarmers,
        totalCategories,
        totalAdoptions,
        totalUsers,
        totalRevenue,
        trend,
      },
    };
  }

  private async loadAllAdoptions(): Promise<AdoptionsEntity[]> {
    return this.adoptionRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.product', 'p')
      .leftJoinAndSelect('p.category', 'c')
      .orderBy('a.id', 'DESC')
      .getMany();
  }

  // 认领价：产品 adopt_price 优先，为 0 时用分类单价 ×0.85 兜底（与 P3 收益口径一致）
  private resolveAdoptPrice(a: AdoptionsEntity): number {
    const rawAdopt = Number(a.product?.adopt_price ?? 0);
    const rawPrice = Number(a.product?.category?.price ?? 0);
    if (rawAdopt > 0) return rawAdopt;
    if (rawPrice > 0) return this.round2(rawPrice * FARMER_SHARE_RATE);
    return 0;
  }

  // 每个分类下产品的最高认领价
  private async productAdoptPriceRows(
    categoryIds: number[],
  ): Promise<{ categoryId: number; maxAdopt: number }[]> {
    const rows = await this.categoryRepo
      .createQueryBuilder('c')
      .innerJoin('products', 'p', 'p.category_id = c.id')
      .select('c.id', 'categoryId')
      .addSelect('MAX(p.adopt_price)', 'maxAdopt')
      .where('c.id IN (:...ids)', { ids: categoryIds })
      .groupBy('c.id')
      .getRawMany();
    return rows.map((r) => ({
      categoryId: Number(r.categoryId),
      maxAdopt: Number(r.maxAdopt),
    }));
  }

  private formatFarmer(farmer: AdminUserEntity) {
    return {
      id: farmer.id,
      username: farmer.username,
      farm_name: farmer.farm_name ?? null,
      qualification: farmer.qualification ?? null,
      phone: farmer.phone ?? null,
      status: farmer.status,
      created_at: farmer.created_at,
    };
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
