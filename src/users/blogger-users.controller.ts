import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { ValidateObjectIdTypePipe } from '../common/pipes/validate-object-id-type.pipe';
import { UsersQueryRepository } from './providers/users.query.repository';
import { CommandBus } from '@nestjs/cqrs';
import { BloggerBanUserInputModel } from './dto/input-models/blogger-ban -user-input-model.dto';
import { BloggerBanUserCommand } from '../blogs/providers/use-cases/blogger-ban-user-use-case';
import { BlogsQueryRepository } from '../blogs/providers/blogs.query.repository';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { BlogsService } from '../blogs/providers/blogs.service';
import { CurrentUserId } from '../common/decorators/current-user-id.param.decorator';

@UseGuards(AccessTokenGuard)
@Controller('blogger/users')
export class BloggerUsersController {
  constructor(
    private commandBus: CommandBus,
    private blogsService: BlogsService,
    private usersQueryRepository: UsersQueryRepository,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {}

  //
  @HttpCode(204)
  @Put(':userId/ban')
  async banUser(
    @Body() bloggerBanUserInputModel: BloggerBanUserInputModel,
    @Param('userId', ValidateObjectIdTypePipe) userId: string,
    @CurrentUserId() bloggerId: string,
  ) {
    if (!(await this.usersQueryRepository.checkUserId(userId))) {
      throw new NotFoundException('Invalid userId');
    }
    const { isBanned, banReason, blogId } = bloggerBanUserInputModel;
    if (!(await this.blogsService.isBlogOwner(blogId, bloggerId))) {
      throw new ForbiddenException('Forbidden');
    }
    await this.commandBus.execute(
      new BloggerBanUserCommand({ userId, isBanned, banReason, blogId }),
    );
  }

  //Returns all banned users for blog
  @Get('blog/:blogId')
  async getUsers(
    @Query('searchLoginTerm') searchLoginTerm: string,
    @Query() query,
    @Param('blogId', ValidateObjectIdTypePipe) blogId: string,
    @CurrentUserId() bloggerId: string,
  ) {
    if (!(await this.blogsQueryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid blog ID');
    }
    if (!(await this.blogsService.isBlogOwner(blogId, bloggerId))) {
      throw new ForbiddenException('Forbidden');
    }
    const paginatorParams = castQueryParams(query);
    return await this.blogsQueryRepository.getBannedUsers(
      paginatorParams,
      searchLoginTerm,
      blogId,
    );
  }
}
