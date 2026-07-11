import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Headers,
  HttpCode,
  Inject,
  Param,
  Post,
  Get,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/service/verify-auth-token/authenticated-user.model';
import {
  VERIFY_AUTH_TOKEN_SERVICE,
  VerifyAuthTokenService,
} from '../../auth/service/verify-auth-token/verify-auth-token.service.interface';
import {
  MANAGE_AGENTS_SERVICE,
  ManageAgentsService,
} from '../service/manage-agents/manage-agents.service.interface';
import { Agent, AgentSummary } from '../service/manage-agents/agent.model';
import { AgentSummaryDto, CreatedAgentDto, CreateAgentDto } from './agent.dto';

/** Handles authenticated HTTP requests for user-owned agents. */
@Controller('agents')
export class AgentsController {
  /** Creates the controller with its domain and authentication services. */
  constructor(
    @Inject(MANAGE_AGENTS_SERVICE)
    private readonly manageAgentsService: ManageAgentsService,
    @Inject(VERIFY_AUTH_TOKEN_SERVICE)
    private readonly verifyAuthTokenService: VerifyAuthTokenService,
  ) {}

  /** Creates an agent owned by the authenticated user. */
  @Post()
  async create(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Body() body: CreateAgentDto,
  ): Promise<CreatedAgentDto> {
    const user: AuthenticatedUser =
      await this.authenticate(authorizationHeader);
    const name: string = this.getValidatedName(body);
    const agent: Agent = await this.manageAgentsService.create(name, user);
    return {
      id: agent.id,
      name: agent.name,
      author: agent.author,
    };
  }

  /** Lists agents owned by the authenticated user. */
  @Get()
  async list(
    @Headers('authorization') authorizationHeader: string | undefined,
  ): Promise<readonly AgentSummaryDto[]> {
    const user: AuthenticatedUser =
      await this.authenticate(authorizationHeader);
    const agents: readonly AgentSummary[] =
      await this.manageAgentsService.list(user);
    return agents.map((agent: AgentSummary): AgentSummaryDto => ({
      id: agent.id,
      name: agent.name,
    }));
  }

  /** Deletes one agent owned by the authenticated user. */
  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('id') id: string,
  ): Promise<void> {
    const user: AuthenticatedUser =
      await this.authenticate(authorizationHeader);
    await this.manageAgentsService.delete(id, user);
  }

  private async authenticate(
    authorizationHeader: string | undefined,
  ): Promise<AuthenticatedUser> {
    return this.verifyAuthTokenService.verifyAuthorizationHeader(
      authorizationHeader,
    );
  }

  private getValidatedName(body: CreateAgentDto): string {
    const rawName: string | undefined = body.name;
    if (typeof rawName !== 'string') {
      throw new BadRequestException();
    }

    const trimmedName: string = rawName.trim();
    if (trimmedName === '') {
      throw new BadRequestException();
    }

    return trimmedName;
  }
}
