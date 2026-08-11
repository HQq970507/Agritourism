import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UploadModule } from './modules/upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { UsersModule } from './modules/users/users.module';
import { BasicExceptionsFilter } from './common/filters/basiceException.filter';
import { DatabaseExceptionFilter } from './common/filters/databaseException.filter ';
import { BadRequestExceptionFilter } from './common/filters/badRequestException.filter';
import { TokenModule } from './modules/token/token.module';
import { TreeModule } from './modules/tree/tree.module';
import { AdminModule } from './modules/admin/admin.module';
import { CommunityModule } from './modules/community/community.module';
import { ActivityModule } from './modules/activity/activity.module';
import { DataChartModule } from './modules/datachart/datachart.module';
import { AiModule } from './modules/ai/ai.module';
import { AgentModule } from './modules/agent/agent.module';
import { WxRunModule } from './modules/wxRun/wxRun.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { TraceabilityModule } from './modules/traceability/traceability.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PointsModule } from './modules/points/points.module';
import { TravelModule } from './modules/travel/travel.module';
import { ScenicModule } from './modules/scenic/scenic.module';
import { WeatherModule } from './modules/weather/weather.module';
import { ContractModule } from './modules/contract/contract.module';
import { AutomationModule } from './modules/automation/automation.module';
import { MediaModule } from './modules/media/media.module';
import { AdoptionModule } from './modules/adoption/adoption.module';
import { FarmerModule } from './modules/farmer/farmer.module';
import { GovernmentModule } from './modules/government/government.module';
import { HomeModule } from './modules/home/home.module';

@Module({
  imports: [
    // 配置模块，用于加载环境变量并全局使用
    ConfigModule.forRoot({ isGlobal: true }),

    // 导入自定义的数据库模块
    DatabaseModule,

    // 导入自定义的上传模块
    UploadModule,

    // 导入自定义的用户模块
    UsersModule,

    // 导入自定义的token模块
    TokenModule,

    // 导入自定义的树模块
    TreeModule,

    // 导入自定义的Admin模块
    AdminModule,

    // 导入自定义的社区模块
    CommunityModule,

    // 导入自定义的Activity模块
    ActivityModule,

    // 导入自定义的DataChart模块
    DataChartModule,

    // 导入自定义的AI模块
    AiModule,

    // 导入自定义的AI Agent模块
    AgentModule,

    // 导入自定义的WxRun模块
    WxRunModule,

    // 导入自定义的追溯模块
    TraceabilityModule,

    // 导入自定义的支付模块
    PaymentModule,

    // 导入自定义的产品模块
    ProductModule,

    // 导入自定义的订单模块
    OrderModule,

    // 导入自定义的积分模块
    PointsModule,

    // 导入自定义的旅游模块（线路库/设施名录/线路预约）
    TravelModule,

    // 导入自定义的文旅景区模块（宁夏5A景区名录）
    ScenicModule,

    // 导入自定义的天气模块（代理中国天气网实时天气）
    WeatherModule,

    // 导入自定义的数字合约模块（合同模板/创建/电子签名）
    ContractModule,

    // 导入自定义的自动化任务模块（定时/间隔任务编排与执行日志）
    AutomationModule,

    // 导入自定义的媒体模块（生长日记 + 慢直播）
    MediaModule,

    // 导入自定义的认领模块（产品认领：联动合约/溯源/积分/日记）
    AdoptionModule,

    // 导入自定义的农户端模块（农户入驻/产品归属/认领订单/收益/看板）
    FarmerModule,

    // 导入自定义的政府端模块（农户监管/产品监管/区域报告）
    GovernmentModule,
    HomeModule,

    // 配置 ServeStaticModule 以服务静态文件
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule], // 引入 ConfigModule 以便在 useFactory 中使用 ConfigService
      inject: [ConfigService], // 注入 ConfigService
      useFactory: async (configService: ConfigService) => [
        {
          // 配置静态文件的根目录
          rootPath: join(
            __dirname,
            '..',
            configService.get<string>('STATIC_FILES'),
          ),
          // 配置静态文件的访问前缀
          serveRoot: configService.get<string>('STATIC_FILES_PREFIX'),
          // 禁用缓存，确保浏览器始终获取最新版本（避免旧页面引用失效CDN导致白屏）
          maxAge: 0,
          cacheControl: true,
          etag: false,
          lastModified: true,
          setHeaders: (res: any) => {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
          },
        },
      ],
    }),
  ],
  controllers: [], // 当前模块中没有定义控制器
  providers: [
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: BasicExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: BadRequestExceptionFilter,
    },
    // 全局验证管道
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
      useValue: new ValidationPipe({
        whitelist: true, // 自动删除请求体中未被定义的属性
        forbidNonWhitelisted: true, // 对于请求体中包含未定义属性的请求返回 400 错误
        transform: true, // 自动将请求体数据转换为 DTO 类型
      }),
    },
  ],
})
export class AppModule {}
