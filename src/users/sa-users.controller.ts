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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { castQueryParams } from '../common/helpers/helpers';
import { UserInputModel } from './dto/userInputModel';
import { ValidateObjectIdTypePipe } from '../common/pipes/validateObjectIdType.pipe';
import { AuthGuard } from '@nestjs/passport';
import { UsersQueryRepository } from './users.query.repository';
import {
  CreateNewUserCommand,
  CreateNewUserUseCase,
} from './use-cases/create-new-user-use-case';
import { DeleteUserCommand } from './use-cases/delete-user-use-case';
import { CommandBus } from '@nestjs/cqrs';
import { UsersService } from './users.service';
import { BanUserInputModel } from './dto/ban -user-input-model.dto';
import { BanUserCommand } from './use-cases/ban-user-use-case';

@UseGuards(AuthGuard('basic'))
@Controller('sa/users')
export class SaUsersController {
  constructor(
    private commandBus: CommandBus,
    private userService: UsersService,
    private createNewUserUseCase: CreateNewUserUseCase,
    private usersQueryRepository: UsersQueryRepository,
  ) {}

  @HttpCode(204)
  @Put(':userId/ban')
  async banUser(
    @Body() banUserInputModel: BanUserInputModel,
    @Param('userId', ValidateObjectIdTypePipe) userId: string,
  ) {
    console.log(userId);
    if (!(await this.usersQueryRepository.checkUserId(userId))) {
      throw new NotFoundException('Invalid blogId');
    }
    await this.commandBus.execute(
      new BanUserCommand(userId, banUserInputModel),
    );
  }

  @Post()
  async createUser(@Body() userInputDto: UserInputModel) {
    const userId = await this.commandBus.execute(
      new CreateNewUserCommand(userInputDto),
    );
    return this.usersQueryRepository.getUserById(userId);
  }

  @Get()
  async getUsers(
    @Query('banStatus') banStatus: string,
    @Query('searchLoginTerm') searchLoginTerm: string,
    @Query('searchEmailTerm') searchEmailTerm: string,
    @Query() query,
  ) {
    const paginatorParams = castQueryParams(query);
    return await this.usersQueryRepository.findUsers(
      paginatorParams,
      searchLoginTerm,
      searchEmailTerm,
      banStatus,
      true,
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
  }
}
