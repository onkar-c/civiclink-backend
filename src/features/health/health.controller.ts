import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getRoot(): string {
    return this.healthService.getHello();
  }

  @Get('health')
  async getHealth() {
    const userCount = await this.healthService.getUserCount();
    return {
      status: 'ok',
      userCount,
    };
  }
}
