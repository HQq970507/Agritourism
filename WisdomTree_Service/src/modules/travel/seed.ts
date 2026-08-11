import { Repository } from 'typeorm';
import { TripRouteEntity } from 'src/database/entities/trip_routes.entity';
import { TripRouteStopEntity } from 'src/database/entities/trip_route_stops.entity';
import { FarmFacilityEntity } from 'src/database/entities/farm_facilities.entity';

interface SeedStop {
  order_index: number;
  name: string;
  type: string;
  time_slot: string;
  duration_minutes: number;
  description: string;
  location: string;
}

interface SeedRoute {
  name: string;
  title: string;
  category: string;
  description: string;
  duration_hours: number;
  distance_km: number;
  difficulty: string;
  best_season: string;
  is_featured: boolean;
  stops: SeedStop[];
}

/**
 * 旅游模块演示种子数据（仅在线路表为空时插入，幂等）
 */
const seedRoutes: SeedRoute[] = [
  {
    name: '红颜草莓采摘亲子线',
    title: '红颜草莓采摘亲子线——甜蜜亲子时光',
    category: '采摘',
    description:
      '全家一起走进红颜草莓采摘园，亲手采摘香甜多汁的红颜草莓，体验农事劳作的乐趣，品尝地道农家土灶美食，畅玩亲子乐园，收获一整天的甜蜜亲子时光。',
    duration_hours: 6,
    distance_km: 12,
    difficulty: '轻松',
    best_season: '12月-4月',
    is_featured: true,
    stops: [
      {
        order_index: 1,
        name: '红颜草莓采摘园',
        type: '采摘',
        time_slot: '09:00-11:00',
        duration_minutes: 90,
        description: '亲手采摘新鲜红颜草莓，学习草莓种植知识，感受田园采摘乐趣。',
        location: '草莓大道1号',
      },
      {
        order_index: 2,
        name: '农事体验坊',
        type: '体验',
        time_slot: '11:00-12:30',
        duration_minutes: 90,
        description: '体验蔬菜种植、果蔬采摘、喂养小动物等农事活动，寓教于乐。',
        location: '田园体验区',
      },
      {
        order_index: 3,
        name: '农家土灶餐厅',
        type: '餐饮',
        time_slot: '12:30-13:30',
        duration_minutes: 60,
        description: '品尝地道的农家土灶柴火饭，本地时令食材现摘现做。',
        location: '乡村路4号',
      },
      {
        order_index: 4,
        name: '亲子乐园',
        type: '体验',
        time_slot: '14:00-16:00',
        duration_minutes: 120,
        description: '亲子互动游乐项目，草垛迷宫、小火车等，共享欢乐亲子时光。',
        location: '亲子乐园',
      },
    ],
  },
  {
    name: '水稻农耕研学线',
    title: '水稻农耕研学线——读懂一粒米的旅程',
    category: '研学',
    description:
      '走进稻田，认识水稻的一生。从稻田博物馆到插秧体验田，从田间午餐到大米加工坊，再到农耕文化馆，让研学少年在劳动中读懂"谁知盘中餐，粒粒皆辛苦"。',
    duration_hours: 7,
    distance_km: 15,
    difficulty: '适中',
    best_season: '6月-10月',
    is_featured: true,
    stops: [
      {
        order_index: 1,
        name: '稻田博物馆',
        type: '观光',
        time_slot: '09:00-10:00',
        duration_minutes: 60,
        description: '了解水稻种植历史、现代农业技术以及稻米文化的传承。',
        location: '稻香路2号',
      },
      {
        order_index: 2,
        name: '插秧体验田',
        type: '体验',
        time_slot: '10:00-11:30',
        duration_minutes: 90,
        description: '挽起裤脚下田插秧，亲身体验农耕的辛劳与乐趣。',
        location: '稻田体验区',
      },
      {
        order_index: 3,
        name: '田间午餐亭',
        type: '餐饮',
        time_slot: '11:30-13:00',
        duration_minutes: 90,
        description: '在田间品尝农家有机午餐，补充能量。',
        location: '稻田旁',
      },
      {
        order_index: 4,
        name: '大米加工坊',
        type: '研学',
        time_slot: '13:30-14:30',
        duration_minutes: 60,
        description: '观摩稻谷从脱壳到成米的全过程，了解大米的加工工艺。',
        location: '加工坊',
      },
      {
        order_index: 5,
        name: '农耕文化馆',
        type: '研学',
        time_slot: '14:30-15:30',
        duration_minutes: 60,
        description: '学习传统农耕文化与二十四节气知识，感受劳动智慧。',
        location: '农耕文化馆',
      },
    ],
  },
  {
    name: '乡村美食寻味线',
    title: '乡村美食寻味线——以味蕾丈量乡村',
    category: '美食',
    description:
      '以味蕾丈量乡村。从有机蔬菜采摘园到农家豆腐坊，从特色农家宴到乡愁小馆，一路寻味最地道的乡村烟火气。',
    duration_hours: 5,
    distance_km: 10,
    difficulty: '轻松',
    best_season: '全年',
    is_featured: false,
    stops: [
      {
        order_index: 1,
        name: '有机蔬菜采摘园',
        type: '采摘',
        time_slot: '09:00-10:30',
        duration_minutes: 90,
        description: '采摘当季有机蔬菜，认识时令食材，感受从田间到餐桌的新鲜。',
        location: '蔬菜大棚区',
      },
      {
        order_index: 2,
        name: '农家豆腐坊',
        type: '体验',
        time_slot: '10:30-12:00',
        duration_minutes: 90,
        description: '亲手体验石磨磨豆、点卤等传统手工豆腐制作工艺。',
        location: '豆腐坊',
      },
      {
        order_index: 3,
        name: '特色农家宴',
        type: '餐饮',
        time_slot: '12:00-13:30',
        duration_minutes: 90,
        description: '品尝十二道农家招牌菜，全是本地当季食材。',
        location: '农家宴餐厅',
      },
      {
        order_index: 4,
        name: '乡愁小馆',
        type: '餐饮',
        time_slot: '14:00-15:00',
        duration_minutes: 60,
        description: '品味记忆中的家乡味道与手作点心，带回一份乡村特产。',
        location: '乡愁小馆',
      },
    ],
  },
  {
    name: '生态康养休闲线',
    title: '生态康养休闲线——在青山绿水间慢下来',
    category: '康养',
    description:
      '在青山绿水间放慢脚步。生态鱼塘垂钓、森林步道漫步、茶园品茗、民宿小院休憩、观景平台远眺，开启一场治愈身心的康养之旅。',
    duration_hours: 8,
    distance_km: 20,
    difficulty: '适中',
    best_season: '全年',
    is_featured: false,
    stops: [
      {
        order_index: 1,
        name: '生态鱼塘垂钓',
        type: '观光',
        time_slot: '09:00-10:30',
        duration_minutes: 90,
        description: '在生态放养鱼塘悠闲垂钓，亲近自然，放松身心。',
        location: '绿水湾7号',
      },
      {
        order_index: 2,
        name: '森林步道',
        type: '观光',
        time_slot: '10:30-12:00',
        duration_minutes: 90,
        description: '漫步负氧离子充沛的森林步道，深呼吸洗肺养生。',
        location: '森林步道入口',
      },
      {
        order_index: 3,
        name: '茶园品茗',
        type: '体验',
        time_slot: '13:00-14:30',
        duration_minutes: 90,
        description: '在高山茶园中品茗新茶，静享惬意慢时光。',
        location: '高山茶园',
      },
      {
        order_index: 4,
        name: '民宿小院',
        type: '住宿',
        time_slot: '15:00-16:00',
        duration_minutes: 60,
        description: '参观原乡民宿小院，体验田园慢生活，可留宿一晚。',
        location: '竹海路5号',
      },
      {
        order_index: 5,
        name: '观景平台',
        type: '观光',
        time_slot: '16:30-17:30',
        duration_minutes: 60,
        description: '登高望远，尽览田园生态画卷，欣赏乡村日落。',
        location: '高山观景台',
      },
    ],
  },
  {
    name: '高山云雾茶园线',
    title: '高山云雾茶园线——茶香氤氲云深处',
    category: '观光',
    description:
      '置身千米高山云雾茶园，亲手采茶、观摩制茶、品茗论道，在茶香氤氲中体验一场高山茶文化之旅。',
    duration_hours: 6,
    distance_km: 18,
    difficulty: '挑战',
    best_season: '3月-5月',
    is_featured: false,
    stops: [
      {
        order_index: 1,
        name: '高山茶园',
        type: '观光',
        time_slot: '09:00-11:00',
        duration_minutes: 120,
        description: '漫步云雾缭绕的高山茶园，亲手采摘明前嫩芽。',
        location: '云顶山路8号',
      },
      {
        order_index: 2,
        name: '制茶工坊',
        type: '研学',
        time_slot: '11:00-12:30',
        duration_minutes: 90,
        description: '观摩传统手工杀青、揉捻、烘焙等制茶工艺。',
        location: '制茶工坊',
      },
      {
        order_index: 3,
        name: '茶文化馆',
        type: '研学',
        time_slot: '14:00-15:00',
        duration_minutes: 60,
        description: '了解中国茶文化的千年历史与当代传承。',
        location: '茶文化馆',
      },
      {
        order_index: 4,
        name: '品茶轩',
        type: '体验',
        time_slot: '15:00-16:30',
        duration_minutes: 90,
        description: '静坐品茗，细赏茶汤与山色，带走一份高山茶礼。',
        location: '品茶轩',
      },
    ],
  },
  {
    name: '春·中卫沙坡头踏青赏沙线',
    title: '春·中卫沙坡头踏青赏沙线——大漠与黄河的春日邂逅',
    category: '采摘',
    description:
      '春日的沙坡头，黄河与沙漠交织成塞上江南独有的春色。踏青赏沙、滑沙观河、摘一把早春的黄河滩枣，在沙漠与绿洲的交界处迎接春天。',
    duration_hours: 5,
    distance_km: 26,
    difficulty: '轻松',
    best_season: '3月-5月',
    is_featured: false,
    stops: [
      {
        order_index: 1,
        name: '沙坡头黄河景区',
        type: '观光',
        time_slot: '09:00-11:00',
        duration_minutes: 120,
        description: '登高俯瞰黄河九曲与大漠金沙，感受"大漠孤烟直，长河落日圆"。',
        location: '中卫市沙坡头区',
      },
      {
        order_index: 2,
        name: '黄河滩枣采摘园',
        type: '采摘',
        time_slot: '11:00-12:30',
        duration_minutes: 90,
        description: '亲手采摘初春的第一茬黄河滩枣，皮薄肉厚、甘甜如蜜。',
        location: '沙坡头区枣林湾',
      },
      {
        order_index: 3,
        name: '黄河农家乐',
        type: '餐饮',
        time_slot: '12:30-14:00',
        duration_minutes: 90,
        description: '品尝黄河鲤鱼、沙葱炒蛋等地道塞上农家味。',
        location: '沙坡头区',
      },
    ],
  },
  {
    name: '春·贺兰山东麓葡萄酒庄踏青线',
    title: '春·贺兰山东麓葡萄酒庄踏青线——紫色长廊的春日微醺',
    category: '采摘',
    description:
      '贺兰山东麓是中国葡萄酒的黄金产区。春日葡萄藤抽芽吐绿，漫步酒庄花园、参观地下酒窖、品鉴新酿，感受紫色长廊的诗意春天。',
    duration_hours: 6,
    distance_km: 20,
    difficulty: '轻松',
    best_season: '3月-5月',
    is_featured: false,
    stops: [
      {
        order_index: 1,
        name: '贺兰山葡萄庄园',
        type: '观光',
        time_slot: '09:30-11:30',
        duration_minutes: 120,
        description: '漫步万亩葡萄园，看春日藤蔓抽芽，远眺贺兰山巍峨雪线。',
        location: '银川市西夏区镇北堡',
      },
      {
        order_index: 2,
        name: '地下酒窖探秘',
        type: '研学',
        time_slot: '11:30-12:30',
        duration_minutes: 60,
        description: '走进恒温酒窖，了解橡木桶陈酿与葡萄酒品鉴入门。',
        location: '酒庄地下酒窖',
      },
      {
        order_index: 3,
        name: '酒庄品鉴厅',
        type: '体验',
        time_slot: '14:00-15:30',
        duration_minutes: 90,
        description: '品鉴贺兰山东麓干红与桃红，搭配宁夏乳酪与滩羊冷盘。',
        location: '酒庄品鉴厅',
      },
    ],
  },
  {
    name: '夏·六盘山清凉避暑亲子线',
    title: '夏·六盘山清凉避暑亲子线——森林氧吧里的亲子时光',
    category: '研学',
    description:
      '盛夏的六盘山是天然的清凉氧吧。亲子徒步森林栈道、探秘高山植物园、亲手制作植物标本，在山泉瀑布间度过22℃的凉爽夏天。',
    duration_hours: 7,
    distance_km: 15,
    difficulty: '中等',
    best_season: '6月-9月',
    is_featured: false,
    stops: [
      {
        order_index: 1,
        name: '六盘山森林公园',
        type: '观光',
        time_slot: '09:00-11:00',
        duration_minutes: 120,
        description: '穿行于云杉冷杉森林，听松涛溪涧，呼吸负氧离子。',
        location: '固原市泾源县',
      },
      {
        order_index: 2,
        name: '高山植物研学课堂',
        type: '研学',
        time_slot: '11:00-12:30',
        duration_minutes: 90,
        description: '认识高山杜鹃、黄芪、党参等植物，亲子协作制作植物标本。',
        location: '研学课堂',
      },
      {
        order_index: 3,
        name: '泾河源山野餐',
        type: '餐饮',
        time_slot: '12:30-13:30',
        duration_minutes: 60,
        description: '溪边野餐，品尝泾源黄牛肉、洋芋擦擦等山野美食。',
        location: '泾河源',
      },
      {
        order_index: 4,
        name: '瀑布溪流戏水',
        type: '体验',
        time_slot: '14:00-15:30',
        duration_minutes: 90,
        description: '在清凉山泉边戏水玩耍，亲子共享夏日清爽。',
        location: '龙潭瀑布',
      },
    ],
  },
  {
    name: '夏·鸣翠湖荷塘研学线',
    title: '夏·鸣翠湖荷塘研学线——塞上湖城的荷花盛宴',
    category: '研学',
    description:
      '银川素有"塞上湖城"美誉，盛夏鸣翠湖万亩荷花盛开。乘船穿行荷塘、认识湿地候鸟、体验芦苇画制作，开启湿地生态研学之旅。',
    duration_hours: 6,
    distance_km: 10,
    difficulty: '轻松',
    best_season: '6月-8月',
    is_featured: false,
    stops: [
      {
        order_index: 1,
        name: '鸣翠湖湿地公园',
        type: '观光',
        time_slot: '09:00-10:30',
        duration_minutes: 90,
        description: '乘画舫穿行万亩荷塘，看接天莲叶、映日荷花。',
        location: '银川市兴庆区',
      },
      {
        order_index: 2,
        name: '湿地鸟类观测站',
        type: '研学',
        time_slot: '10:30-12:00',
        duration_minutes: 90,
        description: '用望远镜观测苍鹭、白鹭、斑嘴鸭等湿地精灵，认识湿地生态。',
        location: '观鸟台',
      },
      {
        order_index: 3,
        name: '芦苇画非遗工坊',
        type: '体验',
        time_slot: '14:00-15:30',
        duration_minutes: 90,
        description: '跟随非遗传承人体验宁夏芦苇画制作，把湖城记忆带回家。',
        location: '非遗工坊',
      },
    ],
  },
  {
    name: '秋·中宁枸杞丰收线',
    title: '秋·中宁枸杞丰收线——红果满枝的丰收盛宴',
    category: '丰收',
    description:
      '中宁是世界枸杞之乡。金秋时节红果满枝，亲手采摘头茬枸杞、走进枸杞加工车间、品尝枸杞宴，体验"杞乡"的丰收喜悦。',
    duration_hours: 6,
    distance_km: 22,
    difficulty: '轻松',
    best_season: '8月-10月',
    is_featured: false,
    stops: [
      {
        order_index: 1,
        name: '中宁枸杞庄园',
        type: '采摘',
        time_slot: '09:00-11:00',
        duration_minutes: 120,
        description: '亲手采摘饱满红亮的中宁枸杞，了解枸杞的千年养生文化。',
        location: '中卫市中宁县',
      },
      {
        order_index: 2,
        name: '枸杞加工体验馆',
        type: '研学',
        time_slot: '11:00-12:30',
        duration_minutes: 90,
        description: '观摩枸杞晾晒、分拣、烘干工艺，体验枸杞茶现炒。',
        location: '加工体验馆',
      },
      {
        order_index: 3,
        name: '杞乡丰收宴',
        type: '餐饮',
        time_slot: '12:30-14:00',
        duration_minutes: 90,
        description: '品尝枸杞炖鸡、枸杞芽菜、枸杞八宝茶等杞乡美食。',
        location: '庄园餐厅',
      },
      {
        order_index: 4,
        name: '枸杞集市',
        type: '体验',
        time_slot: '14:00-15:00',
        duration_minutes: 60,
        description: '逛枸杞集市，选购头茬枸杞、枸杞原浆等杞乡好礼。',
        location: '庄园集市',
      },
    ],
  },
  {
    name: '秋·贺兰山葡萄采摘丰收线',
    title: '秋·贺兰山葡萄采摘丰收线——紫玉满园的丰收季节',
    category: '丰收',
    description:
      '金秋的贺兰山东麓葡萄成熟，紫玉满园。亲手采摘酿酒葡萄、体验脚踩葡萄榨汁、品尝葡萄盛宴，感受丰收的甜蜜与醇香。',
    duration_hours: 7,
    distance_km: 18,
    difficulty: '中等',
    best_season: '9月-10月',
    is_featured: false,
    stops: [
      {
        order_index: 1,
        name: '葡萄园采摘区',
        type: '采摘',
        time_slot: '09:00-11:00',
        duration_minutes: 120,
        description: '亲手剪下一串串紫玉般的酿酒葡萄，品尝北纬38°的甜蜜。',
        location: '镇北堡葡萄园',
      },
      {
        order_index: 2,
        name: '榨汁体验坊',
        type: '体验',
        time_slot: '11:00-12:30',
        duration_minutes: 90,
        description: '体验传统脚踩榨汁与现代化酿造流程，亲手灌装纪念酒。',
        location: '榨汁体验坊',
      },
      {
        order_index: 3,
        name: '葡萄主题宴',
        type: '餐饮',
        time_slot: '12:30-14:00',
        duration_minutes: 90,
        description: '享用葡萄鸡、凉拌葡萄叶、红酒烩牛腩等特色丰收宴。',
        location: '庄园餐厅',
      },
      {
        order_index: 4,
        name: '葡萄酒品鉴会',
        type: '体验',
        time_slot: '14:30-16:00',
        duration_minutes: 90,
        description: '品鉴当年新酿与珍藏级贺兰山东麓葡萄酒。',
        location: '品鉴厅',
      },
    ],
  },
  {
    name: '冬·盐池滩羊美食年货线',
    title: '冬·盐池滩羊美食年货线——一锅滩羊暖冬的塞上年味',
    category: '美食',
    description:
      '冬天来宁夏，不能错过"盐池滩羊"。走进滩羊养殖基地、品尝手抓羊肉全羊宴、赶一场年货大集，把塞上的暖冬年味带回家。',
    duration_hours: 7,
    distance_km: 25,
    difficulty: '轻松',
    best_season: '11月-2月',
    is_featured: false,
    stops: [
      {
        order_index: 1,
        name: '盐池滩羊养殖基地',
        type: '观光',
        time_slot: '09:00-10:30',
        duration_minutes: 90,
        description: '走进"中国滩羊之乡"，了解盐池滩羊的生态养殖故事。',
        location: '吴忠市盐池县',
      },
      {
        order_index: 2,
        name: '手抓羊肉体验馆',
        type: '餐饮',
        time_slot: '11:00-13:00',
        duration_minutes: 120,
        description: '品尝地道手抓羊肉、羊杂碎、羊肉臊子面，暖透整个冬天。',
        location: '盐池县',
      },
      {
        order_index: 3,
        name: '塞上年货大集',
        type: '体验',
        time_slot: '14:00-16:00',
        duration_minutes: 120,
        description: '逛年货大集，选购枸杞、八宝茶、滩羊肉卷等宁夏特产年礼。',
        location: '盐池县年货市场',
      },
    ],
  },
  {
    name: '冬·银川贺兰山暖冬寻味线',
    title: '冬·银川贺兰山暖冬寻味线——雪落贺兰的烟火人间',
    category: '美食',
    description:
      '冬日的银川别有韵味。登贺兰山看雪线连绵、逛怀远夜市暖冬烟火、品八宝茶与枸杞炖品，在塞上湖城过一个暖意融融的冬天。',
    duration_hours: 6,
    distance_km: 16,
    difficulty: '轻松',
    best_season: '11月-2月',
    is_featured: false,
    stops: [
      {
        order_index: 1,
        name: '贺兰山岩画景区',
        type: '观光',
        time_slot: '09:00-11:00',
        duration_minutes: 120,
        description: '雪后登贺兰山，看岩画与雪线辉映，感受万年前游牧文明的印记。',
        location: '银川市贺兰县',
      },
      {
        order_index: 2,
        name: '怀远夜市暖冬行',
        type: '美食',
        time_slot: '17:00-19:00',
        duration_minutes: 120,
        description: '逛银川最热闹的怀远夜市，羊肉串、辣糊糊、牛奶鸡蛋醪糟暖冬暖胃。',
        location: '银川市西夏区怀远路',
      },
      {
        order_index: 3,
        name: '八宝茶慢时光',
        type: '体验',
        time_slot: '19:00-20:30',
        duration_minutes: 90,
        description: '围炉慢煮一碗宁夏八宝茶，配枸杞、桂圆、红枣，暖冬话家常。',
        location: '茶楼',
      },
    ],
  },
];

interface SeedFacility {
  name: string;
  type: string;
  description: string;
  opening_hours: string;
  contact?: string;
  location?: string;
  longitude: string;
  latitude: string;
  city: string;
}

/**
 * 宁夏采摘园/农家乐/民宿设施名录（含真实感经纬度）
 * 城市坐标范围：银川 106.2-106.3/38.4-38.5；石嘴山 106.3-106.5/38.9-39.0；
 * 吴忠 106.1-106.2/37.9-38.0；固原 106.2-106.3/35.9-36.0；中卫 105.1-105.2/37.4-37.5
 */
const seedFacilities: SeedFacility[] = [
  {
    name: '红颜草莓采摘园',
    type: '采摘园',
    description: '红颜草莓品种丰富，个大味甜，支持亲子采摘，12月-4月为最佳采摘季。',
    opening_hours: '09:00-17:00',
    contact: '0951-8888666',
    location: '银川市贺兰县习岗镇',
    longitude: '106.250',
    latitude: '38.462',
    city: '银川',
  },
  {
    name: '水稻插秧体验田',
    type: '体验区',
    description: '可预约插秧、收割等农事体验，提供农具和指导老师，适合研学团队。',
    opening_hours: '08:00-17:00',
    location: '银川市贺兰县四十里店村',
    longitude: '106.289',
    latitude: '38.413',
    city: '银川',
  },
  {
    name: '有机蔬菜园',
    type: '采摘园',
    description: '四季有机蔬菜采摘，绿色无公害，亲子友好，可现采现购。',
    opening_hours: '09:00-17:00',
    location: '银川市永宁县闽宁镇',
    longitude: '106.234',
    latitude: '38.478',
    city: '银川',
  },
  {
    name: '农家土灶餐厅',
    type: '餐厅',
    description: '土灶柴火饭，地道农家菜，食材全部来自周边农场，可容纳30桌。',
    opening_hours: '11:00-20:00',
    contact: '0951-8888667',
    location: '银川市西夏区镇北堡镇',
    longitude: '106.262',
    latitude: '38.457',
    city: '银川',
  },
  {
    name: '竹林民宿',
    type: '民宿',
    description: '六盘山下原乡民宿，含早餐，提供土特产伴手礼，可接待亲子家庭。',
    opening_hours: '24小时',
    contact: '0954-8888668',
    location: '固原市隆德县六盘山景区',
    longitude: '106.241',
    latitude: '35.972',
    city: '固原',
  },
  {
    name: '农耕研学基地',
    type: '研学基地',
    description: '面向青少年的农耕研学课程基地，配备专业讲师与田间课堂。',
    opening_hours: '09:00-16:00',
    contact: '0951-8888669',
    location: '银川市兴庆区掌政镇',
    longitude: '106.218',
    latitude: '38.438',
    city: '银川',
  },
  {
    name: '生态鱼塘',
    type: '体验区',
    description: '生态放养鱼塘，休闲垂钓好去处，提供钓具租赁与鲜鱼加工服务。',
    opening_hours: '08:00-18:00',
    location: '石嘴山市平罗县沙湖景区',
    longitude: '106.442',
    latitude: '38.962',
    city: '石嘴山',
  },
  {
    name: '高山观景台',
    type: '观景台',
    description: '贺兰山麓观景平台，日出云海观赏点，视野开阔，适合拍照打卡。',
    opening_hours: '全天',
    location: '石嘴山市大武口区贺兰山',
    longitude: '106.362',
    latitude: '38.994',
    city: '石嘴山',
  },
  {
    name: '西夏王葡萄庄园',
    type: '采摘园',
    description: '贺兰山东麓酿酒葡萄园，可预约葡萄采摘、品鉴与酒庄参观，9月-10月为成熟季。',
    opening_hours: '09:00-18:00',
    contact: '0951-8888665',
    location: '银川市西夏区镇北堡镇',
    longitude: '106.276',
    latitude: '38.445',
    city: '银川',
  },
  {
    name: '沙坡头西瓜采摘园',
    type: '采摘园',
    description: '黄河沙田西瓜皮薄瓤甜，现场采摘现切现吃，6月-8月为最佳采摘季。',
    opening_hours: '08:00-19:00',
    contact: '0955-8888664',
    location: '中卫市沙坡头区迎水桥镇',
    longitude: '105.172',
    latitude: '37.471',
    city: '中卫',
  },
  {
    name: '中宁枸杞采摘园',
    type: '采摘园',
    description: '中宁枸杞核心产区，鲜果红润饱满，可亲手采摘枸杞并参观晾晒加工，6月-7月为成熟季。',
    opening_hours: '07:00-19:00',
    contact: '0955-8888663',
    location: '中卫市中宁县舟塔乡',
    longitude: '105.163',
    latitude: '37.452',
    city: '中卫',
  },
  {
    name: '吴忠早茶农家乐',
    type: '农家乐',
    description: '体验地道吴忠早茶文化与农家菜，八宝茶、拉面、手抓羊肉一应俱全。',
    opening_hours: '06:00-22:00',
    contact: '0953-8888662',
    location: '吴忠市利通区金银滩镇',
    longitude: '106.152',
    latitude: '37.984',
    city: '吴忠',
  },
];

/**
 * 插入演示数据（幂等）
 * 线路/站点仅在 trip_routes 表为空时插入；
 * 设施名录按名称 upsert：已存在则补充经纬度等信息，不存在则插入，可重复执行。
 */
export async function seedTravelData(
  routeRepo: Repository<TripRouteEntity>,
  stopRepo: Repository<TripRouteStopEntity>,
  facilityRepo: Repository<FarmFacilityEntity>,
): Promise<void> {
  try {
    const routeCount = await routeRepo.count();
    for (const r of seedRoutes) {
      const existing = await routeRepo.findOne({ where: { name: r.name } });
      if (existing) continue;

      const saved = await routeRepo.save({
        name: r.name,
        title: r.title,
        category: r.category,
        description: r.description,
        duration_hours: r.duration_hours,
        distance_km: r.distance_km,
        difficulty: r.difficulty,
        best_season: r.best_season,
        is_featured: r.is_featured,
        status: 'active',
      });

      await stopRepo.save(
        r.stops.map((s) => ({
          route: { id: saved.id },
          order_index: s.order_index,
          name: s.name,
          type: s.type,
          time_slot: s.time_slot,
          duration_minutes: s.duration_minutes,
          description: s.description,
          location: s.location,
        })),
      );
    }
    console.log(
      `[seed] 旅游线路数据已插入: ${seedRoutes.length}条线路`,
    );

    await seedFacilityData(facilityRepo);
  } catch (error) {
    console.error('[seed] 旅游演示数据插入失败:', error);
  }
}

/**
 * 设施名录种子（幂等，可重复执行）
 * 按 name 匹配：已存在则更新经纬度/城市等信息，不存在则插入。
 */
async function seedFacilityData(
  facilityRepo: Repository<FarmFacilityEntity>,
): Promise<void> {
  const existing = await facilityRepo.find();
  const byName = new Map(existing.map((f) => [f.name, f]));

  const toInsert: Array<SeedFacility & { status: string }> = [];
  const toUpdate: Array<Partial<FarmFacilityEntity>> = [];

  for (const f of seedFacilities) {
    const row = byName.get(f.name);
    if (row) {
      toUpdate.push({
        id: row.id,
        longitude: f.longitude,
        latitude: f.latitude,
        city: f.city,
        location: f.location ?? row.location,
        description: f.description,
        opening_hours: f.opening_hours,
        contact: f.contact ?? row.contact,
      });
    } else {
      toInsert.push({ ...f, status: 'open' });
    }
  }

  if (toUpdate.length > 0) {
    await facilityRepo.save(toUpdate);
  }
  if (toInsert.length > 0) {
    await facilityRepo.save(toInsert);
  }

  console.log(
    `[seed] 设施名录已同步: 更新${toUpdate.length}条, 新增${toInsert.length}条`,
  );
}
