import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { ProductEntity } from './products.entity';
import { ProductMediaEntity } from './product_media.entity';
import { OrderEntity } from './orders.entity';

/**
 * 产品分类实体类
 * 该类代表数据库中产品分类表的实体，包括产品分类的基本信息。
 */
@Entity('product_categories')
@Unique(['name'])
export class ProductCategoryEntity {
  /**
   * 分类ID
   * 自增长的主键，用于唯一标识每个产品分类。
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  // 分类头像
  @Column({ type: 'varchar', length: 255 })
  avatar: string;

  /**
   * 产品分类名称。
   */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /**
   * 展示名称
   * 产品的通俗名称，便于公众理解和识别。
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  display_name: string;

  /**
   * 描述
   * 关于产品分类的详细描述信息。
   */
  @Column({ type: 'text' })
  description: string;

  // 产品总量
  @Column({ type: 'int' })
  total: number;

  // 剩余数量
  @Column({ type: 'int' })
  remaining: number;

  // 单价
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  // 单位
  @Column({ type: 'varchar', length: 50, default: '个' })
  unit: string;

  // 所需积分
  @Column({ type: 'int', default: 0 })
  points_required: number;

  // 归属农户ID（关联 admin_user 表 role='farmer' 的账号；为空表示平台自营）
  @Column({ type: 'int', nullable: true })
  farmer_id: number;

  // 上架状态：on（在售）/ off（政府监管下架）
  @Column({ type: 'varchar', length: 20, default: 'on' })
  status: string;

  /**
   * 创建时间
   */
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  updated_at: Date;

  // 一对多 一个分类有多个产品
  @OneToMany(() => ProductEntity, (p) => p.category)
  products: ProductEntity[];

  // 一对多 一个分类有多个产品媒体
  @OneToMany(() => ProductMediaEntity, (pm) => pm.category)
  productMedia: ProductMediaEntity[];

  // 一对多 一个分类有多个订单
  @OneToMany(() => OrderEntity, (o) => o.category)
  orders: OrderEntity[];
}
