import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductMediaEntity } from './product_media.entity';
import { OrderEntity } from './orders.entity';
import { ProductCategoryEntity } from './product_categories.entity';
import { AdoptionsEntity } from './adoptions.entity';

/**
 * 产品实体类
 * 该类代表数据库中产品表的实体，包括产品的基本信息和关联信息。
 */
@Entity('products')
export class ProductEntity {
  /**
   * 产品ID
   * 自增长的主键，用于唯一标识每个产品。
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  // 是否已售出
  @Column({ type: 'boolean', default: false })
  is_sold: boolean;

  // 产品单价
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  // 产品单位（如：斤、棵、份）
  @Column({ type: 'varchar', length: 100, nullable: true })
  unit: string;

  // 是否可认领（农旅产品认领；默认可认领，后台可关闭）
  @Column({ type: 'boolean', default: true })
  adoptable: boolean;

  // 认领价（展示用，默认与单价一致按 0 处理）
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  adopt_price: number;

  // 归属农户ID（关联 admin_user 表 role='farmer' 的账号；为空表示平台自营）
  @Column({ type: 'int', nullable: true })
  farmer_id: number;

  /**
   * 创建时间
   * 记录产品信息的创建时间
   */
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  /**
   * 更新时间
   * 记录产品信息的最后更新时间，可为空。
   */
  @UpdateDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  updated_at: Date;

  /**
   * 产品媒体
   * 与该产品关联的媒体集合，每个产品可以有多个媒体文件。
   */
  @OneToMany(() => ProductMediaEntity, (media) => media.product)
  media: ProductMediaEntity[];

  /**
   * 产品订单
   * 与该产品关联的订单信息集合。
   */
  @OneToMany(() => OrderEntity, (order) => order.product)
  orders: OrderEntity[];

  // 产品分类，外键和product_categories表关联
  @ManyToOne(() => ProductCategoryEntity, (cat) => cat.products)
  @JoinColumn({ name: 'category_id' })
  category: ProductCategoryEntity;

  // 产品认领记录
  @OneToMany(() => AdoptionsEntity, (adoption) => adoption.product)
  adoptions: AdoptionsEntity[];
}
