import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateIssueDto, IssuePriorityDto } from './dto/create-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { ListIssuesQueryDto } from './dto/list-issues-query.dto';
import { UserRole, IssueStatus } from '@prisma/client';
import { UpdateIssueDto } from './dto/update-issue.dto';


@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}


  async getIssueById(issueId: string, requesterUserId: string, requesterRole: UserRole) {
  const issue = await this.prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,

      createdByUserId: true,

      createdByUser: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (!issue) throw new NotFoundException('Issue not found');

  const isPrivileged = requesterRole === UserRole.ADMIN || requesterRole === UserRole.DISPATCHER;
  const isOwner = issue.createdByUserId === requesterUserId;

  if (!isPrivileged && !isOwner) {
    throw new ForbiddenException('You are not allowed to view this issue');
  }

  return issue;
}

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

async updateIssue(
  issueId: string,
  dto: UpdateIssueDto,
  requesterUserId: string,
  requesterRole: UserRole,
) {
  // Reject empty PATCH payloads (common API hardening)
  const hasAnyField = Object.values(dto).some((v) => v !== undefined);
  if (!hasAnyField) {
    throw new BadRequestException('No fields provided for update');
  }

  const issue = await this.prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      id: true,
      createdByUserId: true,
      status: true,
    },
  });

  if (!issue) throw new NotFoundException('Issue not found');

  const isPrivileged = requesterRole === UserRole.ADMIN || requesterRole === UserRole.DISPATCHER;
  const isOwner = issue.createdByUserId === requesterUserId;

  // Citizens can only edit their own issues while still OPEN
  if (!isPrivileged) {
    if (!isOwner) throw new ForbiddenException('You are not allowed to update this issue');
    if (issue.status !== IssueStatus.OPEN) {
      throw new ForbiddenException('Issue can only be edited while status is OPEN');
    }
  }

  // IMPORTANT: Only update allowed fields. Do not spread dto blindly if you later add fields.
  const data = {
    ...(dto.title !== undefined ? { title: dto.title } : {}),
    ...(dto.description !== undefined ? { description: dto.description } : {}),
    ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
    ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
    ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
    ...(dto.address !== undefined ? { address: dto.address } : {}), // remove if not in schema
  };

  return this.prisma.issue.update({
    where: { id: issueId },
    data,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
      createdByUserId: true,
    },
  });
}

}
