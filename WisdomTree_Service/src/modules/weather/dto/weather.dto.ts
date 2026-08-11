import { IsString } from 'class-validator';

// 实时天气数据 DTO（对应中国天气网 d1 接口返回字段的映射）
export class WeatherDataDto {
  @IsString({ message: '城市名必须是字符串' })
  city: string;

  @IsString({ message: '温度必须是字符串' })
  temp: string;

  @IsString({ message: '天气现象必须是字符串' })
  weather: string;

  @IsString({ message: '风向必须是字符串' })
  wind_direction: string;

  @IsString({ message: '风力等级必须是字符串' })
  wind_level: string;

  @IsString({ message: '湿度必须是字符串' })
  humidity: string;

  @IsString({ message: '空气质量指数必须是字符串' })
  aqi: string;

  @IsString({ message: '更新时间必须是字符串' })
  updated_at: string;

  @IsString({ message: '日期必须是字符串' })
  date: string;
}
