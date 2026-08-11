import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContractTemplateEntity } from './contract_template.entity';
import { UserEntity } from './user.entity';

/**
 * 合同实体类
 *
 * 该类映射数据库中的 contracts 表，记录用户基于模板创建的电子合同。
 * 创建时状态为 draft，用户通过电子签名（输入姓名 + 时间戳）后状态变为 signed，
 * 实现认养 / 采摘 / 认购 / 体验课报名等农旅场景的线上合同闭环。
 */
@Entity('contracts')
export class ContractEntity {
  /**
   * 合同ID
   * 自增长的主键，用于唯一标识一份合同。
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  // 合同编号（格式：CT + YYYYMMDD + 4位随机数）
  @Column({ type: 'varchar', length: 100, unique: true })
  contract_no: string;

  /**
   * 合同模板
   * 多对一关系，关联合同模板表。
   */
  @ManyToOne(() => ContractTemplateEntity)
  @JoinColumn({ name: 'template_id' })
  template: ContractTemplateEntity;

  /**
   * 所属用户
   * 多对一关系，关联用户表。
   */
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  // 合同标题（渲染后的标题）
  @Column({ type: 'varchar', length: 200 })
  title: string;

  // 完整渲染后的 HTML 内容（占位符已替换）
  @Column({ type: 'text' })
  content_html: string;

  // 合同状态（draft/signed/completed）
  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  // 乙方（如：宁夏智慧农旅合作社）
  @Column({ type: 'varchar', length: 100 })
  party_b: string;

  // 电子签名姓名
  @Column({ type: 'varchar', length: 100, nullable: true })
  signature_name: string;

  // 签署时间
  @Column({ type: 'timestamp', nullable: true })
  signed_at: Date;

  // 已填写的字段值
  @Column({ type: 'json' })
  fields_data: any;

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
