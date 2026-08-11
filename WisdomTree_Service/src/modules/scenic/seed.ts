import { Repository } from 'typeorm';
import { ScenicSpotEntity } from 'src/database/entities/scenic_spots.entity';

/**
 * 宁夏文旅景区种子数据
 * 数据来源：文化和旅游部大众旅游服务栏目（lyfw.mct.gov.cn）
 * 国家5A级景区6个 + 国家级旅游度假区1个
 */
const scenicSeed: Partial<ScenicSpotEntity>[] = [
  {
    name: '沙坡头旅游景区',
    level: '5A',
    city: '中卫',
    location: '宁夏回族自治区中卫市沙坡头区迎水桥镇',
    description:
      '国家AAAAA级旅游景区，距离中卫市区15公里。沙、河、山、园的交响乐，浩瀚的腾格里沙漠在此与奔涌的黄河交汇相拥，被誉为"中国沙漠旅游基地"。先后被联合国环境规划署授予全球环境保护500佳单位，被《中国地理杂志》评为"中国五大最美的沙漠之一"。',
    features: ['沙漠冲浪', '骆驼骑行', '黄河漂流', '滑沙', '沙漠星空帐篷'],
    cover_image: '',
    opening_hours: '08:00-18:00',
    ticket: '约100元/人',
    contact: '',
    weather_code: '101170501',
    is_featured: true,
  },
  {
    name: '沙湖旅游景区',
    level: '5A',
    city: '石嘴山',
    location: '宁夏回族自治区石嘴山市平罗县姚沙公路',
    description:
      '国家5A级景区，地处贺兰山下、黄河金岸，距银川市42公里。景区总面积80.10平方公里，20余平方公里沙漠与40余平方公里水域毗邻而居，既有大漠戈壁之雄浑，又有江南水乡之秀美，被誉为"世间少有"的文化旅游胜地。金沙、碧水、翠苇、飞鸟、游鱼、远山、彩荷七大资源天然组合。',
    features: ['动力飞伞', '古道驼铃', '激情滑沙', '冲浪越野', '沙湖大鱼头'],
    cover_image: '',
    opening_hours: '08:00-17:00',
    ticket: '约80元/人',
    contact: '400-180-0952',
    weather_code: '101170201',
    is_featured: true,
  },
  {
    name: '六盘山红军长征旅游区',
    level: '5A',
    city: '固原',
    location: '宁夏回族自治区固原市隆德县东侧',
    description:
      '国家5A级旅游景区，中国工农红军长征翻越的最后一座大山，被誉为"红色之山""曙光之山""胜利之山"。1935年毛泽东翻越六盘山时留下著名诗篇《清平乐·六盘山》。旅游区总面积12平方公里，含红军长征纪念广场、纪念馆、纪念碑、纪念亭、吟诗台、红军小道等，"宁夏二十一景"之一"红色六盘"的代表地。',
    features: ['红军长征纪念馆', '红军小道', '长征纪念亭', '吟诗台', '红色研学'],
    cover_image: '',
    opening_hours: '08:00-17:30',
    ticket: '约60元/人',
    contact: '',
    weather_code: '101170401',
    is_featured: true,
  },
  {
    name: '青铜峡黄河大峡谷旅游区',
    level: '5A',
    city: '吴忠',
    location: '宁夏吴忠市青铜峡市青铜峡镇',
    description:
      '国家5A级旅游景区、全国重点文物保护单位、全国科普教育基地，黄河上游最后一道峡谷，素有"黄河小三峡"之誉。十里长峡十里景，十里画廊在青铜。由宁夏引黄古灌区、宁夏水利博览馆、青铜峡水利枢纽、一百零八塔、大禹文化园、库区鸟岛六大景观组成，是世界灌溉工程遗产宁夏引黄古灌区的精华之地。',
    features: ['一百零八塔', '大禹文化园', '青铜峡水利枢纽', '库区鸟岛', '十里长峡'],
    cover_image: '',
    opening_hours: '08:00-18:00',
    ticket: '约70元/人',
    contact: '',
    weather_code: '101170302',
    is_featured: true,
  },
  {
    name: '水洞沟旅游区',
    level: '5A',
    city: '银川',
    location: '宁夏回族自治区银川市灵武市临河镇鄂托克前旗',
    description:
      '国家5A级旅游景区，中国最早发掘的旧石器时代文化遗址，被誉为"中国史前考古的发祥地"。水洞沟独特的雅丹地貌与明代长城遗址交相辉映，藏兵洞、大峡谷、古人类遗址等景观展现了四万年前古人类生活场景与明代军事防御体系。',
    features: ['史前考古遗址', '藏兵洞', '明代长城', '雅丹地貌', '芦花谷'],
    cover_image: '',
    opening_hours: '08:00-18:00',
    ticket: '约120元/人',
    contact: '',
    weather_code: '101170101',
    is_featured: false,
  },
  {
    name: '镇北堡西部影视城',
    level: '5A',
    city: '银川',
    location: '宁夏回族自治区银川市西夏区镇北堡镇',
    description:
      '国家5A级旅游景区，中国西部影视拍摄基地，被誉为"东方好莱坞"。古朴原始、粗犷荒凉的自然景观吸引了《大话西游》《红高粱》《新龙门客栈》等百余部影视作品在此拍摄，是体验中国西部影视文化的标志性景点。',
    features: ['影视拍摄基地', '明城', '清城', '老银川一条街'],
    cover_image: '',
    opening_hours: '08:00-18:00',
    ticket: '约100元/人',
    contact: '',
    weather_code: '101170101',
    is_featured: false,
  },
  {
    name: '六盘山旅游度假区',
    level: '国家级旅游度假区',
    city: '固原',
    location: '宁夏固原市六盘山区域',
    description:
      '国家级旅游度假区，六盘山红军长征旅游区的核心配套度假区域。依托六盘山独特的高山森林、湿地草甸、云海日出等自然生态资源，融合红色文化、生态康养、避暑休闲功能，是宁夏重要的避暑度假目的地。',
    features: ['高山森林', '云海日出', '生态康养', '避暑度假'],
    cover_image: '',
    opening_hours: '全天开放',
    ticket: '免费（部分景点收费）',
    contact: '',
    weather_code: '101170401',
    is_featured: false,
  },
];

export async function seedScenicSpots(
  scenicRepo: Repository<ScenicSpotEntity>,
): Promise<void> {
  try {
    const count = await scenicRepo.count();
    if (count > 0) return;

    await scenicRepo.save(scenicSeed);
    console.log(`[seed] 宁夏文旅景区种子数据已插入: ${scenicSeed.length}个`);
  } catch (error) {
    console.error('[seed] 景区种子数据插入失败:', error);
  }
}
