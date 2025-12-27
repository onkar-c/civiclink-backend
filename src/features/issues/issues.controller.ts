import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { ListIssuesQueryDto } from './dto/list-issues-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateIssueDto } from './dto/update-issue.dto';


import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Issues')
@ApiBearerAuth()
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() body: CreateIssueDto) {
    const userId = req.user.userId;
    const issue = await this.issuesService.createIssue(userId, body);
    return issue;
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  async getMine(@Req() req: any) {
    const userId = req.user.userId;
    const issues = await this.issuesService.getIssuesForUser(userId);
    return issues;
  }

  // NEW: dispatcher-only filtered + paginated list
  @UseGuards(JwtAuthGuard)
  @Get()
  async listAll(
    @Req() req: any,
    @Query() query: ListIssuesQueryDto,
  ) {
    const userRole = req.user.role;
    return this.issuesService.listIssuesForDispatcher(query, userRole);
  }

  @UseGuards(JwtAuthGuard)
@Patch(':id/status')
async updateStatus(
  @Param('id') id: string,
  @Req() req: any,
  @Body() body: UpdateIssueStatusDto,
) {
  const userRole = req.user.role;
  const userId = req.user.userId;

  const updated = await this.issuesService.updateIssueStatus(
    id,
    body.status,
    userRole,
    userId,
  );
  return updated;
}

    @UseGuards(JwtAuthGuard)
@Get(':id/history')
async getHistory(@Param('id') id: string, @Req() req: any) {
  const userRole = req.user.role;
  const userId = req.user.userId;

  return this.issuesService.getIssueHistory(id, userId, userRole);
}

 @UseGuards(JwtAuthGuard)
 @Get(':id')
getIssueById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() req: any) {
  return this.issuesService.getIssueById(id, req.user.userId, req.user.role);
}

@UseGuards(JwtAuthGuard)
@Patch(':id')
updateIssue(
  @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  @Body() dto: UpdateIssueDto,
  @Req() req: any,
) {
  return this.issuesService.updateIssue(id, dto, req.user.userId, req.user.role);
}
}
