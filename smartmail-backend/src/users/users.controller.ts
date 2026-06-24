import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from './schemas/user.schema';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: CreateUserDto) {
    if (dto.role === Role.CLIENT) {
      throw new BadRequestException('Le rôle client ne peut pas être créé depuis l\'administration');
    }
    return this.usersService.create(dto);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN)
  updateStatus(@Param('id') id: string, @Body('actif') actif: boolean) {
    return this.usersService.updateStatus(id, actif);
  }

  @Patch(':id/role')
  @Roles(Role.SUPER_ADMIN)
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    if (role === Role.CLIENT) {
      throw new BadRequestException('Le rôle client ne peut pas être attribué depuis l\'administration');
    }
    return this.usersService.updateRole(id, role);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
