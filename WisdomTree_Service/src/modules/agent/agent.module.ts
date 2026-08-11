import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from 'src/modules/token/token.module';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { IntentClassifier } from './intent.classifier';
import { ToolRegistry } from './tool.registry';
import { MemoryService } from './memory.service';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { ProductTool } from './tools/product.tool';
import { OrderTool } from './tools/order.tool';
import { ActivityTool } from './tools/activity.tool';
import { DiagnoseTool } from './tools/diagnose.tool';
import { TripTool } from './tools/trip.tool';
import { JwtAuthGuard } from 'src/common/guards/token.guard';

@Module({
  imports: [DatabaseModule, TokenModule, ConfigModule, KnowledgeModule],
  controllers: [AgentController],
  providers: [
    JwtAuthGuard,
    AgentService,
    IntentClassifier,
    ToolRegistry,
    MemoryService,
    ProductTool,
    OrderTool,
    ActivityTool,
    DiagnoseTool,
    TripTool,
  ],
})
export class AgentModule {}
