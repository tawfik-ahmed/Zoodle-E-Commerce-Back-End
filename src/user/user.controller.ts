import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../utils/enums';
import { UpdateUserDto } from './dtos/update-user.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayloadType } from '../utils/types';

// ~ api/v1/users
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public findAll(@Query() query) {
    return this.userService.getAllUsers(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUser(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public delete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }
}

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users-me')
export class UserMeController {
  constructor(private readonly userService: UserService) {}
  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public getMe(@CurrentUser() payload: JwtPayloadType) {
    return this.userService.getMe(payload);
  }

  @Patch()
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public updateMe(
    @CurrentUser() payload: JwtPayloadType,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateMe(payload, dto);
  }

  @Delete()
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public deleteMe(@CurrentUser() payload: JwtPayloadType) {
    return this.userService.deleteMe(payload);
  }
}
