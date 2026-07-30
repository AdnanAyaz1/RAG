import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe() {
    return this.usersService.findById('current-user');
  }

  @Post()
  create(@Body() dto: any) {
    return this.usersService.create(dto);
  }
}