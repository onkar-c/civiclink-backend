import { IsEnum } from 'class-validator';

export enum IssueStatusDto {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export class UpdateIssueStatusDto {
  @IsEnum(IssueStatusDto)
  status: IssueStatusDto;
}
