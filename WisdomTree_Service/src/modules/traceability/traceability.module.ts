import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from 'src/modules/token/token.module';
import { TraceabilityController } from './traceability.controller';
import { TraceabilityService } from './traceability.service';
import { JwtAuthGuard } from 'src/common/guards/token.guard';

@Module({
  imports: [DatabaseModule, TokenModule],
  controllers: [TraceabilityController],
  providers: [JwtAuthGuard, TraceabilityService],
  exports: [TraceabilityService],
})
export class TraceabilityModule {}
