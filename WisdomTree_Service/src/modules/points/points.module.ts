import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from '../token/token.module';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';

@Module({
  imports: [DatabaseModule, TokenModule],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
