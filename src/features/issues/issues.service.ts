import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateIssueDto, IssuePriorityDto } from './dto/create-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { ListIssuesQueryDto } from './dto/list-issues-query.dto';


@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  async createIssue(userId: string, data: CreateIssueDto) {
    const priority = data.priority ?? IssuePriorityDto.MEDIUM;

    const issue = await this.prisma.issue.create({
      data: {
        title: data.title,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        priority,
        status: 'OPEN',
        createdByUserId: userId,
      },
    });

    return issue;
  }

  async getIssuesForUser(userId: string) {
    return this.prisma.issue.findMany({
      where: {
        createdByUserId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // NEW: status update with dispatcher-only check
  async updateIssueStatus(
  issueId: string,
  newStatus: UpdateIssueStatusDto['status'],
  userRole: string,
  userId: string,
) {
  if (userRole !== 'DISPATCHER' && userRole !== 'ADMIN') {
    throw new ForbiddenException('Only dispatchers or admins can update issue status');
  }

  const existing = await this.prisma.issue.findUnique({
    where: { id: issueId },
  });

  if (!existing) {
    throw new NotFoundException('Issue not found');
  }

  const fromStatus = existing.status;

  const [updated] = await this.prisma.$transaction([
    this.prisma.issue.update({
      where: { id: issueId },
      data: { status: newStatus },
    }),
    this.prisma.issueEvent.create({
      data: {
        issueId,
        changedByUserId: userId,
        fromStatus,
        toStatus: newStatus,
        // note: you could add a note field later
      },
    }),
  ]);

  return updated;
}


   async listIssuesForDispatcher(
    query: ListIssuesQueryDto,
    userRole: string,
  ) {
    if (userRole !== 'DISPATCHER' && userRole !== 'ADMIN') {
      throw new ForbiddenException('Only dispatchers or admins can list all issues');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.issue.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      this.prisma.issue.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }



  async getIssueHistory(
  issueId: string,
  userId: string,
  userRole: string,
) {
  const issue = await this.prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      id: true,
      createdByUserId: true,
    },
  });

  if (!issue) {
    throw new NotFoundException('Issue not found');
  }

  // Allow:
  // - Dispatchers (global)
  // - The user who created the issue
  const isCreator = issue.createdByUserId === userId;
  const isDispatcher = userRole === 'DISPATCHER';
  const isAdmin = userRole === 'Admin';

  if (!isCreator && !isDispatcher && !isAdmin) {
    throw new ForbiddenException(
      'You are not allowed to view this issue history',
    );
  }

  const events = await this.prisma.issueEvent.findMany({
    where: { issueId },
    orderBy: { createdAt: 'asc' },
    include: {
      changedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return {
    issueId,
    events,
  };
}

}
