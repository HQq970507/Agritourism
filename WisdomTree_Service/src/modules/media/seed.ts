import { Repository } from 'typeorm';
import { GrowthDiaryEntity } from 'src/database/entities/growth_diary.entity';
import { LivestreamEntity } from 'src/database/entities/livestream.entity';

/**
 * 生长日记演示种子数据（红颜草莓完整生长周期）
 * created_at 按认养天数回溯错开，形成时间线效果
 */
const seedDiaryEntries: Partial<GrowthDiaryEntity>[] = [
  {
    product_name: '红颜草莓',
    stage: 'seedling',
    day_count: 7,
    description: '幼苗破土而出，嫩芽带着晨露，生机盎然',
    temperature: '18-22°C',
    humidity: '65%',
  },
  {
    product_name: '红颜草莓',
    stage: 'growing',
    day_count: 14,
    description: '植株茁壮成长，叶片翠绿舒展，大棚内阳光充足',
    temperature: '20-25°C',
    humidity: '60%',
  },
  {
    product_name: '红颜草莓',
    stage: 'flowering',
    day_count: 21,
    description: '洁白小花竞相绽放，蜂蝶环绕，即将进入坐果期',
    temperature: '22-26°C',
    humidity: '58%',
  },
  {
    product_name: '红颜草莓',
    stage: 'fruiting',
    day_count: 28,
    description: '果实逐渐饱满，由青转红，甜度持续累积',
    temperature: '22-28°C',
    humidity: '60%',
  },
  {
    product_name: '红颜草莓',
    stage: 'harvest',
    day_count: 35,
    description: '红颜草莓迎来丰收！果香四溢，颗颗饱满多汁',
    temperature: '20-26°C',
    humidity: '55%',
  },
];

/**
 * 慢直播演示频道（演示模式：占位流地址，无真实RTSP/FFmpeg）
 */
const seedStreams: Partial<LivestreamEntity>[] = [
  {
    channel_name: '草莓园慢直播',
    product_name: '红颜草莓',
    stream_url: 'https://demo.stream/live/strawberry.m3u8',
    is_live: true,
    viewers: 126,
    location: '银川·贺兰山草莓基地',
  },
  {
    channel_name: '水稻田慢直播',
    product_name: '东北大米',
    stream_url: 'https://demo.stream/live/rice.m3u8',
    is_live: true,
    viewers: 89,
    location: '吴忠·黄河灌区',
  },
  {
    channel_name: '茶园慢直播',
    product_name: '高山绿茶',
    stream_url: 'https://demo.stream/live/tea.m3u8',
    is_live: false,
    viewers: 0,
    location: '固原·六盘山茶园',
  },
];

/**
 * 插入演示数据（幂等）
 * 仅当 growth_diary / livestreams 表为空时分别插入。
 */
export async function seedMediaData(
  diaryRepo: Repository<GrowthDiaryEntity>,
  streamRepo: Repository<LivestreamEntity>,
): Promise<void> {
  try {
    const diaryCount = await diaryRepo.count();
    if (diaryCount === 0) {
      const now = Date.now();
      const DAY = 24 * 60 * 60 * 1000;
      const maxDay = 35;
      await diaryRepo.save(
        seedDiaryEntries.map((entry) => ({
          ...entry,
          created_at: new Date(now - (maxDay - (entry.day_count ?? 0)) * DAY),
        })),
      );
      console.log(
        `[seed] 生长日记演示数据已插入: ${seedDiaryEntries.length}条`,
      );
    }

    const streamCount = await streamRepo.count();
    if (streamCount === 0) {
      await streamRepo.save(seedStreams);
      console.log(`[seed] 慢直播演示数据已插入: ${seedStreams.length}个频道`);
    }
  } catch (error) {
    console.error('[seed] 媒体演示数据插入失败:', error);
  }
}
