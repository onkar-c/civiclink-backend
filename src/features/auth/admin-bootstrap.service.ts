// src/auth/admin-bootstrap.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const adminEmail =
      process.env.ADMIN_EMAIL ??
      'admin@civiclink.local';
    const adminPassword =
      process.env.ADMIN_PASSWORD ??
      'Admin123!';
    const adminName =
      process.env.ADMIN_NAME ?? 'System Admin';
       

    // 1) If ANY admin exists, do nothing
    const existingAdmin = await this.usersService.findFirstByRole(
      UserRole.ADMIN,                        // 👈 use enum
    );
   
    if (existingAdmin) {
      this.logger.log(
        `Admin user already exists (${existingAdmin.email}), skipping bootstrap.`,
      );
      return;
    }

    // 2) Check if user with ADMIN_EMAIL exists
    let adminUser = await this.usersService.findByEmail(adminEmail);
    let createdAdminUser ;

    if (!adminUser) {
      this.logger.log(
        `No user found with admin email ${adminEmail}, creating via AuthService.register()`,
      );

        createdAdminUser = await this.usersService.register({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        // add other required fields if your RegisterDto needs them
      } as any);
    } else {
      this.logger.log(
        `User with email ${adminEmail} already exists, promoting to ADMIN`,
      );
    }

    // 3) Ensure user has ADMIN role
    if (createdAdminUser && (createdAdminUser.role !== UserRole.ADMIN)) {        // 👈 compare with enum
      await this.usersService.updateUserRole(createdAdminUser.id, UserRole.ADMIN);
      this.logger.log(
        `User ${createdAdminUser.email} promoted to ADMIN role during bootstrap.`,
      );
    } else {
      this.logger.log(
        `User ${createdAdminUser?.email} is already ADMIN, nothing to promote.`,
      );
    }
  }
}
