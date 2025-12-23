import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { User, UserRole } from '@prisma/client';

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

  async updateRole(userId: string, role: UserRole) { // 👈 and here
    return this.prisma.user.update({
      where: { id: userId },
      data: { role }, // type-safe now, role: UserRole
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


}
