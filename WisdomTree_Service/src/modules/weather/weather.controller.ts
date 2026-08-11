import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  /**
   * 实时天气（公开接口，无需鉴权）
   * GET /weather/now?city=101170101
   */
  @Get('now')
  async getWeather(@Query('city') city?: string) {
    return await this.weatherService.getWeather(city);
  }
}
