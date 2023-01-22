import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { castQueryParams } from '../infrastructure/helpers/helpers';
import { QueryRepository } from '../infrastructure/repositories/query.repository';
import { UserInputModel } from '../application/inputModels/userInputModel';
import { UsersService } from '../application/users.service';

@Controller('users')
export class UsersController {
  constructor(
    private queryRepository: QueryRepository,
    private usersService: UsersService,
  ) {}

  @Get()
  async getUsers(
    @Query('searchLoginTerm') searchLoginTerm: string | null = null,
    @Query('searchEmailTerm') searchEmailTerm: string | null = null,
    @Query() query,
  ) {
    const paginatorParams = castQueryParams(query);
    console.log(paginatorParams);
    return await this.queryRepository.findUsers(
      paginatorParams,
      searchLoginTerm,
      searchEmailTerm,
    );
  }

  @Post()
  async createUser(@Body() userInputDto: UserInputModel) {
    return await this.usersService.createNewUser(userInputDto);
  }

  @Delete(':userId')
  @HttpCode(204)
  async deleteBlog(@Param('userId') userId: string) {
    if (!(await this.queryRepository.checkUserId(userId))) {
      throw new NotFoundException('Invalid blogId');
    }
    const result = await this.usersService.deleteUser(userId);
    if (!result) {
      throw new InternalServerErrorException('Blog not deleted');
    }
    return;
  }
}
