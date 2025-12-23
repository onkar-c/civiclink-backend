import { Body, Controller, Post, Get, Query , Patch,
  Param,
  HttpCode,} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() body: RegisterUserDto) {
    const user = await this.usersService.register(body);
    return user;
  }

  @Get()
  async getUsers(@Query() query: GetUsersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    const { users, total } = await this.usersService.findPaginated(
      page,
      pageSize,
    );

    // Strip sensitive fields (passwordHash, updatedAt, etc.)
    const safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    }));

    return {
      data: safeUsers,
      total,
      page,
      pageSize,
    };
  }


  @Patch(':id/role')
  @HttpCode(204) // No Content — matches apiPatch<void, ...>
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
  ): Promise<void> {
    await this.usersService.updateRole(id, body.role);
    // No response body for 204; frontend just gets success
  }
}
