import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

/** Request body for creating a user-owned agent. */
export class CreateAgentDto {
  /** Non-empty agent name, trimmed before validation. */
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  readonly name!: string;
}

/** HTTP response for a newly created agent. */
export interface CreatedAgentDto {
  /** Unique immutable agent identifier. */
  readonly id: string;

  /** User-visible agent name. */
  readonly name: string;

  /** Authenticated owner email address. */
  readonly author: string;
}

/** HTTP response item for listing owned agents. */
export interface AgentSummaryDto {
  /** Unique immutable agent identifier. */
  readonly id: string;

  /** User-visible agent name. */
  readonly name: string;
}
