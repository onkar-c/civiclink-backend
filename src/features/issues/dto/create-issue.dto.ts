import { IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum IssuePriorityDto {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class CreateIssueDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsEnum(IssuePriorityDto)
  priority?: IssuePriorityDto; // default will be MEDIUM if not provided
}
