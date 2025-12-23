import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello from CivicLink backend!';
  }

  async getUserCount(): Promise<number> {
    return this.prisma.user.count();
  }
}
