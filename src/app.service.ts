import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello from CivicLink backend!';
  }

  async getUserCount(): Promise<number> {
    const count = await this.prisma.user.count();
    return count;
  }
}
