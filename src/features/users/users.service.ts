import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { User, UserRole } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async register(data: RegisterUserDto) {
    // 1. Check if email is already taken
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('Email is already in use');
    }

    // 2. Hash the password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 3. Create user in DB
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: 'CITIZEN', // default role for now
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }



  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findFirstByRole(role: UserRole) {           // 👈 use UserRole here
    return this.prisma.user.findFirst({
      where: { role },
    });
  }

  async updateUserRole(userId: string, role: UserRole) {
    const exists = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  async findPaginated(
  page: number,
  pageSize: number,
): Promise<{ users: User[]; total: number }> {
  const skip = (page - 1) * pageSize;

  const [users, total] = await this.prisma.$transaction([
    this.prisma.user.findMany({
      skip,
      take: pageSize,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    this.prisma.user.count(),
  ]);

  return { users, total };
}



  async listUsers(page: number, pageSize: number) {
    if (page < 1 || pageSize < 1) throw new BadRequestException('Invalid pagination');

    const skip = (page - 1) * pageSize;

    const [total, items] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }


}
