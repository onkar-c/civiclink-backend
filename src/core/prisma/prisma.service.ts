import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const url = process.env.DATABASE_URL;
    console.log(process.env);
  if (!url) {
    throw new Error('DATABASE_URL is not set. Create a .env file with DATABASE_URL=postgresql://user:pass@host:port/db');
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);

  super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
