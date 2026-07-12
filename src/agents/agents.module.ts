import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentsController } from './controller/agents.controller';
import { PrismaAgentStoreRepository } from './repository/agent-store/prisma-agent-store.repository';
import { AGENT_STORE_REPOSITORY } from './repository/agent-store/agent-store.repository.interface';
import { ManageAgentsDomainService } from './service/manage-agents/manage-agents.service';
import { MANAGE_AGENTS_SERVICE } from './service/manage-agents/manage-agents.service.interface';
import { ChatAgentDomainService } from './service/chat-agent/chat-agent.service';
import { CHAT_AGENT_SERVICE } from './service/chat-agent/chat-agent.service.interface';
import { GenerateOpenAiAgentResponseService } from './service/generate-agent-response/generate-agent-response.service';
import { GENERATE_AGENT_RESPONSE_SERVICE } from './service/generate-agent-response/generate-agent-response.service.interface';

/** Provides authenticated agent-management HTTP behavior. */
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AgentsController],
  providers: [
    PrismaAgentStoreRepository,
    ManageAgentsDomainService,
    ChatAgentDomainService,
    GenerateOpenAiAgentResponseService,
    {
      provide: AGENT_STORE_REPOSITORY,
      useExisting: PrismaAgentStoreRepository,
    },
    {
      provide: MANAGE_AGENTS_SERVICE,
      useExisting: ManageAgentsDomainService,
    },
    {
      provide: CHAT_AGENT_SERVICE,
      useExisting: ChatAgentDomainService,
    },
    {
      provide: GENERATE_AGENT_RESPONSE_SERVICE,
      useExisting: GenerateOpenAiAgentResponseService,
    },
  ],
})
export class AgentsModule {}
