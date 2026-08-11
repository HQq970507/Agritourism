import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from '../token/token.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

/**
 * 产品模块
 *
 * 该模块负责产品相关功能。
 * 它通过导入数据库模块和令牌模块来利用它们的功能。
 * 控制器处理HTTP请求，而服务则提供业务逻辑。
 */

@Module({
  imports: [DatabaseModule, TokenModule],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
