import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 合同模板实体类
 *
 * 该类映射数据库中的 contract_templates 表，存储可复用的合同模板
 * （认养协议 / 采摘预约协议 / 农产品认购协议 / 农耕体验课报名）。
 * template_html 使用 {{buyerName}}、{{partyB}}、{{date}} 以及自定义字段占位符，
 * 创建合同时由服务层渲染成最终 HTML。
 */
@Entity('contract_templates')
export class ContractTemplateEntity {
  /**
   * 模板ID
   * 自增长的主键，用于唯一标识一个合同模板。
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  // 模板名称（如：认养协议）
  @Column({ type: 'varchar', length: 100 })
  name: string;

  // 模板编码（adoption/pickup/subscription/course）
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  // 模板描述
  @Column({ type: 'text' })
  description: string;

  // 模板 HTML（含占位符）
  @Column({ type: 'text' })
  template_html: string;

  // 字段定义：[{ name, label, type, required }]
  @Column({ type: 'json' })
  fields: any[];

  // 是否启用
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  /**
   * 创建时间
   */
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;
}
