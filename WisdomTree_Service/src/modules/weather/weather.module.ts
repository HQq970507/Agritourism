import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

/**
 * 天气模块
 *
 * 提供 /weather/now 接口，服务端代理中国天气网（weather.com.cn）实时天气数据，
 * 避免前端直连境外天气源（wttr.in）及浏览器跨域/防盗链问题。
 */
@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [WeatherController],
  providers: [WeatherService],
  exports: [WeatherService],
})
export class WeatherModule {}
