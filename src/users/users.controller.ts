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
import { castQueryParams } from '../common/helpers/helpers';
import { UserInputModel } from './dto/userInputModel';
import { ValidateObjectIdTypePipe } from '../common/pipes/validateObjectIdType.pipe';
import { AuthGuard } from '@nestjs/passport';
import { UsersQueryRepository } from './users.query.repository';
import { CreateNewUserCommand } from './use-cases/create-new-user-use-case';
import { DeleteUserCommand } from './use-cases/delete-user-use-case';
import { CommandBus } from '@nestjs/cqrs';

@UseGuards(AuthGuard('basic'))
@Controller('users')
export class UsersController {
  constructor(
    private commandBus: CommandBus,
    private usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get()
  async getUsers(
    @Query('searchLoginTerm') searchLoginTerm: string | null = null,
    @Query('searchEmailTerm') searchEmailTerm: string | null = null,
    @Query() query,
  ) {
    const paginatorParams = castQueryParams(query);
    return await this.usersQueryRepository.findUsers(
      paginatorParams,
      searchLoginTerm,
      searchEmailTerm,
    );
  }

  @Post()
  async createUser(@Body() userInputDto: UserInputModel) {
    return await this.commandBus.execute(
      new CreateNewUserCommand(userInputDto, true),
    );
  }

  @Delete(':userId')
  @HttpCode(204)
  async deleteBlog(@Param('userId', ValidateObjectIdTypePipe) userId: string) {
    if (!(await this.usersQueryRepository.checkUserId(userId))) {
      throw new NotFoundException('Invalid blogId');
    }
    const result = await this.commandBus.execute(new DeleteUserCommand(userId));
    if (!result) {
      throw new InternalServerErrorException('Blog not deleted');
    }
    return;
  }
}
