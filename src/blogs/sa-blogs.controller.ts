import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogInputModel } from './dto/blogInputModel';
import { castQueryParams } from '../common/helpers/helpers';
import { PostsService } from '../posts/posts.service';
import { AuthGuard } from '@nestjs/passport';
import { BlogsQueryRepository } from './blogs.query.repository';
import { UsersQueryRepository } from '../users/users.query.repository';
import { WRONG_BLOG_ID, WRONG_USER_ID } from './blogs.constant';
import { CommandBus } from '@nestjs/cqrs';
import { BindBlogWithUserCommand } from './use-cases/bind-blog-with-user-use-case';

@Controller('sa/blogs')
export class SaBlogsController {
  constructor(
    private blogsService: BlogsService,
    private postService: PostsService,
    private blogsQueryRepository: BlogsQueryRepository,
    private usersQueryRepository: UsersQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @UseGuards(AuthGuard('basic'))
  @Get()
  async getBlogs(
    @Query('searchNameTerm') searchNameTerm: string | null = null,
    @Query() paginatorQuery,
  ) {
    const paginatorParams = castQueryParams(paginatorQuery);
    return await this.blogsQueryRepository.findBlogs(
      paginatorParams,
      searchNameTerm,
      { ownerInclude: true },
    );
  }

  @UseGuards(AuthGuard('basic'))
  @Put(':blogId/bind-with-user/:userId')
  @HttpCode(204)
  async editBlog(
    @Param('blogId') blogId: string,
    @Param('userId') userId: string,
  ) {
    const errors = [];
    const blogOwner = await this.blogsQueryRepository.getBlogOwner(blogId);
    if (
      blogOwner?.userId ||
      !(await this.blogsQueryRepository.checkBlogId(blogId))
    ) {
      errors.push({ message: WRONG_BLOG_ID, field: 'id' });
    }
    if (!(await this.usersQueryRepository.checkUserId(userId))) {
      errors.push({ message: WRONG_USER_ID, field: 'userId' });
    }
    if (errors.length > 0) throw new BadRequestException(errors);
    await this.commandBus.execute(new BindBlogWithUserCommand(blogId, userId));
  }
}