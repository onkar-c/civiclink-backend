import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum IssueStatusFilter {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum IssuePriorityFilter {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class ListIssuesQueryDto {
  @IsOptional()
  @IsEnum(IssueStatusFilter)
  status?: IssueStatusFilter;

  @IsOptional()
  @IsEnum(IssuePriorityFilter)
  priority?: IssuePriorityFilter;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}
