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
  UseGuards,
} from '@nestjs/common';
import { castQueryParams } from '../infrastructure/helpers/helpers';
import { QueryRepository } from '../query/query.repository';
import { UserInputModel } from './dto/userInputModel';
import { UsersService } from './users.service';
import { ValidateObjectIdTypePipe } from '../api/pipes/validateObjectIdType.pipe';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('basic'))
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
    return await this.queryRepository.findUsers(
      paginatorParams,
      searchLoginTerm,
      searchEmailTerm,
    );
  }

  @Post()
  async createUser(@Body() userInputDto: UserInputModel) {
    return await this.usersService.createNewUser(userInputDto, true);
  }

  @Delete(':userId')
  @HttpCode(204)
  async deleteBlog(@Param('userId', ValidateObjectIdTypePipe) userId: string) {
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
