import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from '../token/token.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [DatabaseModule, TokenModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
