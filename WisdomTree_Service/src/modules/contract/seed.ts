import { Repository } from 'typeorm';
import { ContractTemplateEntity } from 'src/database/entities/contract_template.entity';

interface SeedField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface SeedTemplate {
  name: string;
  code: string;
  description: string;
  fields: SeedField[];
  template_html: string;
}

/**
 * 合同模板演示种子数据（仅当 contract_templates 表为空时插入，幂等）
 * 覆盖认养协议 / 采摘预约协议 / 农产品认购协议 / 农耕体验课报名 四类农旅场景。
 * 占位符：{{buyerName}} 甲方姓名、{{partyB}} 乙方、{{date}} 签订日期，以及自定义字段。
 */
const seedTemplates: SeedTemplate[] = [
  {
    name: '认养协议',
    code: 'adoption',
    description: '用户认养农旅园区产品（水果/家禽等）的协议，享有定期生长报告与优先采摘权。',
    fields: [
      { name: 'productName', label: '认养产品', type: 'text', required: true },
      { name: 'productType', label: '产品类型', type: 'text', required: true },
      { name: 'quantity', label: '数量', type: 'text', required: true },
      { name: 'term', label: '认养期限', type: 'text', required: true },
    ],
    template_html: `
      <h3>认养协议</h3>
      <p>甲方（认养人）：<strong>{{buyerName}}</strong>　乙方：<strong>{{partyB}}</strong></p>
      <p>签订日期：{{date}}</p>
      <h4>一、认养内容</h4>
      <p>甲方自愿认养乙方旗下<strong>{{productName}}</strong>（<strong>{{productType}}</strong>）<strong>{{quantity}}</strong>，认养期限为<strong>{{term}}</strong>。</p>
      <h4>二、双方权益</h4>
      <p>1. 认养期间，甲方享有定期生长报告与优先采摘权；</p>
      <p>2. 乙方负责产品的日常管护，确保产品健康生长；</p>
      <p>3. 认养期满后，甲方享有优先续约权。</p>
      <h4>三、其他约定</h4>
      <p>本协议一式两份，甲乙双方各执一份，自双方电子签署之日起生效。</p>
    `.trim(),
  },
  {
    name: '采摘预约协议',
    code: 'pickup',
    description: '用户预约农旅园区采摘活动的协议，约定日期、人数与园区。',
    fields: [
      { name: 'visitDate', label: '采摘日期', type: 'text', required: true },
      { name: 'partySize', label: '人数', type: 'text', required: true },
      { name: 'location', label: '园区', type: 'text', required: true },
    ],
    template_html: `
      <h3>采摘预约协议</h3>
      <p>预约人：<strong>{{buyerName}}</strong>　乙方：<strong>{{partyB}}</strong></p>
      <p>预约日期：{{date}}</p>
      <h4>一、预约内容</h4>
      <p>预约人计划于<strong>{{visitDate}}</strong>前往<strong>{{location}}</strong>参加采摘活动，同行人数<strong>{{partySize}}</strong>人。</p>
      <h4>二、注意事项</h4>
      <p>1. 请按预约时间准时到达，入园时请出示本协议；</p>
      <p>2. 采摘所得按园区称重计费，具体价格以当日园区公告为准；</p>
      <p>3. 如遇特殊天气，园区将提前通知改期。</p>
    `.trim(),
  },
  {
    name: '农产品认购协议',
    code: 'subscription',
    description: '用户批量认购园区农产品的协议，约定产品、数量、单价与配送方式。',
    fields: [
      { name: 'productName', label: '产品', type: 'text', required: true },
      { name: 'quantity', label: '数量(斤)', type: 'text', required: true },
      { name: 'price', label: '单价', type: 'text', required: true },
      { name: 'deliveryType', label: '配送方式', type: 'text', required: true },
    ],
    template_html: `
      <h3>农产品认购协议</h3>
      <p>甲方（认购人）：<strong>{{buyerName}}</strong>　乙方：<strong>{{partyB}}</strong></p>
      <p>签订日期：{{date}}</p>
      <h4>一、认购内容</h4>
      <p>甲方向乙方认购农产品<strong>{{productName}}</strong>，数量<strong>{{quantity}}</strong>斤，单价<strong>{{price}}</strong>元/斤，配送方式为<strong>{{deliveryType}}</strong>。</p>
      <h4>二、交付约定</h4>
      <p>1. 乙方按约定时间组织采摘分拣并配送，保证产品新鲜；</p>
      <p>2. 配送范围及费用以乙方公布的规则为准；</p>
      <p>3. 产品如有质量问题，甲方可凭本协议申请退换。</p>
    `.trim(),
  },
  {
    name: '农耕体验课报名',
    code: 'course',
    description: '用户报名农耕体验课程的协议，约定课程名称、上课日期与报名人数。',
    fields: [
      { name: 'courseName', label: '课程', type: 'text', required: true },
      { name: 'courseDate', label: '上课日期', type: 'text', required: true },
      { name: 'students', label: '报名人数', type: 'text', required: true },
    ],
    template_html: `
      <h3>农耕体验课报名协议</h3>
      <p>报名人：<strong>{{buyerName}}</strong>　乙方：<strong>{{partyB}}</strong></p>
      <p>报名日期：{{date}}</p>
      <h4>一、课程信息</h4>
      <p>报名参加<strong>{{courseName}}</strong>课程，上课日期为<strong>{{courseDate}}</strong>，报名人数<strong>{{students}}</strong>人。</p>
      <h4>二、课程约定</h4>
      <p>1. 课程含导师讲解与农事实践，请提前10分钟到场签到；</p>
      <p>2. 如因个人原因无法参加，请提前24小时联系乙方调整；</p>
      <p>3. 本报名协议自双方电子签署之日起生效。</p>
    `.trim(),
  },
];

/**
 * 插入合同模板种子数据（幂等）
 * 仅当 contract_templates 表为空时插入四条模板。
 */
export async function seedContractTemplates(
  templateRepo: Repository<ContractTemplateEntity>,
): Promise<void> {
  try {
    const templateCount = await templateRepo.count();
    if (templateCount > 0) {
      return;
    }

    await templateRepo.save(
      seedTemplates.map((t) => ({
        name: t.name,
        code: t.code,
        description: t.description,
        fields: t.fields,
        template_html: t.template_html,
        is_active: true,
      })),
    );

    console.log(
      `[seed] 合同模板已插入: ${seedTemplates.length}条（认养/采摘/认购/体验课）`,
    );
  } catch (error) {
    console.error('[seed] 合同模板插入失败:', error);
  }
}
