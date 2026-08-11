import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ApiResponse } from 'src/common/interfaces/res.interface';
import { WeatherDataDto } from './dto/weather.dto';

// 宁夏城市代码表
const CITY_CODES: Record<string, string> = {
  '101170101': '银川',
  '101170201': '石嘴山',
  '101170301': '吴忠',
  '101170401': '固原',
  '101170501': '中卫',
  '101170202': '平罗',
  '101170302': '青铜峡',
};

const DEFAULT_CITY_CODE = '101170101';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * 实时天气
   *
   * 代理中国天气网（weather.com.cn）d1 接口：
   *   GET https://d1.weather.com.cn/sk_2d/{cityCode}.html
   * 响应为 JSONP 风格文本（`var dataSK={...};`），需剥离前缀与结尾分号后 JSON.parse。
   * 上游不可达时返回占位数据（status 200），保证前端可用。
   */
  async getWeather(cityCode: string = DEFAULT_CITY_CODE): Promise<ApiResponse<WeatherDataDto>> {
    const code = this.normalizeCityCode(cityCode);
    const cityName = CITY_CODES[code] ?? '银川';

    try {
      const { data } = await lastValueFrom(
        this.httpService.get(`https://d1.weather.com.cn/sk_2d/${code}.html`, {
          headers: {
            Referer: 'https://www.weather.com.cn/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          timeout: 8000,
          // d1 接口返回纯文本（JS），axios 默认按 JSON 解析会失败，需按文本接收
          responseType: 'text',
        }),
      );

      const payload = this.parseDataSK(data);
      const dto: WeatherDataDto = {
        city: payload.cityname || cityName,
        temp: payload.temp ?? '--',
        weather: payload.weather ?? '--',
        wind_direction: payload.WD ?? '--',
        wind_level: payload.WS ?? '--',
        humidity: payload.SD ?? '--',
        aqi: payload.aqi ?? '--',
        updated_at: payload.time ?? '--',
        date: payload.date ?? '--',
      };

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '获取成功',
        data: dto,
      };
    } catch (err) {
      this.logger.warn(`天气接口获取失败 (city=${code}): ${(err as Error).message}`);
      return {
        status: HttpStatus.OK,
        code: 0,
        message: '获取成功',
        data: this.buildFallback(cityName),
      };
    }
  }

  /** 剥离 `var dataSK=` 前缀与结尾分号，返回原始 JSON 对象 */
  private parseDataSK(raw: unknown): Record<string, any> {
    let text = typeof raw === 'string' ? raw : String(raw ?? '');
    text = text.trim();
    text = text.replace(/^var\s+dataSK\s*=\s*/, '');
    text = text.replace(/;\s*$/, '');
    return JSON.parse(text);
  }

  /** 城市代码规范化：非法/未知代码回退到银川 */
  private normalizeCityCode(cityCode?: string): string {
    if (!cityCode || !/^101\d{6}$/.test(cityCode)) {
      return DEFAULT_CITY_CODE;
    }
    return cityCode;
  }

  /** 上游不可达时的占位数据 */
  private buildFallback(city: string): WeatherDataDto {
    return {
      city,
      temp: '--',
      weather: '--',
      wind_direction: '--',
      wind_level: '--',
      humidity: '--',
      aqi: '--',
      updated_at: '--',
      date: '--',
    };
  }
}
