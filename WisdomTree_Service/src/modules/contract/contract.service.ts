import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractTemplateEntity } from 'src/database/entities/contract_template.entity';
import { ContractEntity } from 'src/database/entities/contract.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { CreateContractDto } from './dto/contract.dto';
import { ApiResponse, ApiResponseSuccess } from 'src/common/interfaces/res.interface';
import dayjs from 'dayjs';

/** 乙方默认主体 */
const DEFAULT_PARTY_B = '宁夏智慧农旅合作社';

interface RenderSignature {
  name: string;
  signedAt: Date;
}

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(ContractTemplateEntity)
    private readonly templateRepo: Repository<ContractTemplateEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * 可用合同模板列表
   * 仅返回启用状态的模板。
   */
  async getTemplates(): Promise<ApiResponse<ContractTemplateEntity[]>> {
    const templates = await this.templateRepo.find({
      where: { is_active: true },
      order: { id: 'ASC' },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: templates,
    };
  }

  /**
   * 创建合同
   * 1. 校验模板存在且启用
   * 2. 校验模板必填字段均已填写
   * 3. 渲染 content_html（替换 {{buyerName}}/{{partyB}}/{{date}} 与自定义字段占位符）
   * 4. 生成合同编号，保存为 draft 状态
   */
  async createContract(
    userId: number,
    dto: CreateContractDto,
  ): Promise<ApiResponse<ContractEntity>> {
    const template = await this.templateRepo.findOne({
      where: { id: dto.templateId, is_active: true },
    });
    if (!template) {
      throw new HttpException('合同模板不存在', HttpStatus.NOT_FOUND);
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    const fields: Record<string, any> = dto.fields ?? {};
    const templateFields = Array.isArray(template.fields) ? template.fields : [];
    const missing = templateFields.filter(
      (f) =>
        fields[f.name] === undefined ||
        fields[f.name] === null ||
        String(fields[f.name]).trim() === '',
    );
    if (missing.length > 0) {
      const names = missing.map((f) => f.label || f.name).join('、');
      throw new HttpException(
        `缺少必填字段：${names}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const contractNo = await this.generateContractNo();

    const firstField = templateFields[0];
    const firstValue = firstField
      ? String(fields[firstField.name] ?? '').trim()
      : '';
    const title = firstValue
      ? `${template.name}（${firstValue}）`
      : template.name;

    const contentHtml = this.renderContract({
      template,
      fields,
      buyerName: user.username,
      partyB: DEFAULT_PARTY_B,
      contractNo,
      title,
    });

    const contract = await this.contractRepo.save({
      contract_no: contractNo,
      template: { id: template.id },
      user: { id: userId },
      title,
      content_html: contentHtml,
      status: 'draft',
      party_b: DEFAULT_PARTY_B,
      fields_data: fields,
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '合同创建成功',
      data: contract,
    };
  }

  /**
   * 我的合同列表（含模板名称与状态）
   */
  async getMyContracts(userId: number): Promise<ApiResponse<any[]>> {
    const contracts = await this.contractRepo.find({
      where: { user: { id: userId } },
      relations: ['template'],
      order: { id: 'DESC' },
    });

    const data = contracts.map((c) => ({
      id: c.id,
      contract_no: c.contract_no,
      templateId: c.template?.id ?? null,
      templateName: c.template?.name ?? '',
      templateCode: c.template?.code ?? '',
      title: c.title,
      status: c.status,
      party_b: c.party_b,
      signature_name: c.signature_name,
      signed_at: c.signed_at,
      fields_data: c.fields_data,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data,
    };
  }

  /**
   * 合同详情
   * 返回完整 content_html、字段值与状态（仅本人可见）。
   */
  async getContractDetail(
    contractId: number,
    userId: number,
  ): Promise<ApiResponse<any>> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, user: { id: userId } },
      relations: ['template'],
    });
    if (!contract) {
      throw new HttpException('合同不存在', HttpStatus.NOT_FOUND);
    }

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: {
        id: contract.id,
        contract_no: contract.contract_no,
        templateId: contract.template?.id ?? null,
        templateName: contract.template?.name ?? '',
        title: contract.title,
        content_html: contract.content_html,
        fields_data: contract.fields_data,
        status: contract.status,
        party_b: contract.party_b,
        signature_name: contract.signature_name,
        signed_at: contract.signed_at,
        created_at: contract.created_at,
        updated_at: contract.updated_at,
      },
    };
  }

  /**
   * 电子签名
   * 仅本人可签署自己的合同，签署后状态变为 signed，
   * 记录签名姓名与签署时间，并重新渲染含签名区块的 content_html。
   */
  async signContract(
    contractId: number,
    userId: number,
    signatureName: string,
  ): Promise<ApiResponse<ContractEntity>> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, user: { id: userId } },
      relations: ['template'],
    });
    if (!contract) {
      throw new HttpException('合同不存在', HttpStatus.NOT_FOUND);
    }
    if (contract.status === 'signed') {
      throw new HttpException('该合同已签署', HttpStatus.BAD_REQUEST);
    }
    if (contract.status !== 'draft') {
      throw new HttpException('当前状态不可签署', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    const signedAt = new Date();

    const contentHtml = this.renderContract({
      template: contract.template,
      fields: contract.fields_data ?? {},
      buyerName: user.username,
      partyB: contract.party_b || DEFAULT_PARTY_B,
      contractNo: contract.contract_no,
      title: contract.title,
      signature: { name: signatureName, signedAt },
    });

    await this.contractRepo.update(
      { id: contract.id },
      {
        status: 'signed',
        signature_name: signatureName,
        signed_at: signedAt,
        content_html: contentHtml,
      },
    );

    const updated = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ['template'],
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '签署成功',
      data: updated,
    };
  }

  /**
   * 删除合同（仅草稿状态）
   * 已签署的合同不允许删除。
   */
  async deleteContract(
    contractId: number,
    userId: number,
  ): Promise<ApiResponseSuccess> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, user: { id: userId } },
    });
    if (!contract) {
      throw new HttpException('合同不存在', HttpStatus.NOT_FOUND);
    }
    if (contract.status !== 'draft') {
      throw new HttpException('仅草稿状态的合同可删除', HttpStatus.BAD_REQUEST);
    }

    await this.contractRepo.delete({ id: contract.id });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '删除成功',
    };
  }

  /**
   * 渲染合同 HTML
   * 将模板中的 {{buyerName}}/{{partyB}}/{{date}} 与自定义字段占位符替换为实际值，
   * 并包裹成带样式的完整 HTML 文档（含电子签名区块）。
   */
  private renderContract(params: {
    template: ContractTemplateEntity;
    fields: Record<string, any>;
    buyerName: string;
    partyB: string;
    contractNo: string;
    title: string;
    signature?: RenderSignature;
  }): string {
    const {
      template,
      fields,
      buyerName,
      partyB,
      contractNo,
      title,
      signature,
    } = params;

    const today = dayjs().format('YYYY年MM月DD日');

    let body = template.template_html;
    body = body.split('{{buyerName}}').join(buyerName);
    body = body.split('{{partyB}}').join(partyB);
    body = body.split('{{date}}').join(today);
    for (const f of Array.isArray(template.fields) ? template.fields : []) {
      const value =
        fields[f.name] !== undefined && fields[f.name] !== null
          ? String(fields[f.name])
          : '';
      body = body.split(`{{${f.name}}}`).join(value);
    }

    const signatureHtml = signature
      ? `
        <div class="signature">
          <p class="sig-title">甲方电子签名：</p>
          <p class="sig-name">${this.escapeHtml(signature.name)}</p>
          <p class="sig-time">签署时间：${dayjs(signature.signedAt).format(
            'YYYY-MM-DD HH:mm:ss',
          )}</p>
        </div>`
      : `<p class="sig-pending">（待甲方电子签署）</p>`;

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 24px;
      background: #f5f6f4;
      font-family: "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
      color: #2d2d2d;
      line-height: 1.8;
    }
    .contract {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 10px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      padding: 40px 48px;
      border-top: 6px solid #4c8c3b;
    }
    .contract-head {
      text-align: center;
      border-bottom: 1px dashed #d9d9d9;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .contract-head h1 {
      font-size: 24px;
      color: #2d5a27;
      margin: 0 0 6px;
    }
    .contract-no {
      font-size: 13px;
      color: #888;
      margin: 0;
    }
    .contract-body h3 {
      font-size: 18px;
      color: #2d5a27;
      margin: 18px 0 8px;
    }
    .contract-body h4 {
      font-size: 15px;
      color: #3c6b34;
      margin: 14px 0 6px;
    }
    .contract-body p {
      margin: 6px 0;
    }
    .contract-footer {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px dashed #d9d9d9;
      font-size: 14px;
    }
    .contract-footer p {
      margin: 4px 0;
    }
    .signature {
      margin-top: 18px;
      padding: 14px 18px;
      background: #f2f8ef;
      border-left: 4px solid #4c8c3b;
      border-radius: 6px;
    }
    .signature .sig-title {
      margin: 0;
      color: #555;
    }
    .signature .sig-name {
      font-size: 26px;
      font-family: "KaiTi", "STKaiti", serif;
      font-weight: bold;
      color: #1d4d16;
      margin: 2px 0;
    }
    .signature .sig-time {
      margin: 0;
      font-size: 13px;
      color: #888;
    }
    .sig-pending {
      margin: 18px 0 0;
      color: #b0b0b0;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="contract">
    <div class="contract-head">
      <h1>${title}</h1>
      <p class="contract-no">合同编号：${contractNo}</p>
    </div>
    <div class="contract-body">${body}</div>
    <div class="contract-footer">
      <p>甲方：${this.escapeHtml(buyerName)}</p>
      <p>乙方：${this.escapeHtml(partyB)}</p>
      <p>签订日期：${today}</p>
      ${signatureHtml}
    </div>
  </div>
</body>
</html>`.trim();
  }

  /**
   * 生成合同编号：CT + YYYYMMDD + 4位随机数
   */
  private async generateContractNo(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const datePart = dayjs().format('YYYYMMDD');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const no = `CT${datePart}${randomPart}`;
      const existing = await this.contractRepo.findOne({
        where: { contract_no: no },
      });
      if (!existing) {
        return no;
      }
    }
    throw new HttpException(
      '合同编号生成失败，请重试',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  /**
   * 转义 HTML 特殊字符，防止注入
   */
  private escapeHtml(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
