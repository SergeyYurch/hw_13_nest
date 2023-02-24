import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogsService } from './providers/blogs.service';
import { castQueryParams } from '../common/helpers/helpers';
import { PostsService } from '../posts/providers/posts.service';
import { AuthGuard } from '@nestjs/passport';
import { BlogsQueryRepository } from './providers/blogs.query.repository';
import { UsersQueryRepository } from '../users/providers/users.query.repository';
import { WRONG_BLOG_ID } from './constants/blogs.constant';
import { CommandBus } from '@nestjs/cqrs';
import { BindBlogWithUserCommand } from './providers/use-cases/bind-blog-with-user-use-case';
import { BlogInputModel } from './dto/input-models/blog.input.model';
import { CreateNewBlogCommand } from './providers/use-cases/create-new-blog-use-case';
import { BanBlogInputModel } from './dto/input-models/ban-blog.input.model';
import { BanBlogCommand } from './providers/use-cases/ban-blog-use-case';

@UseGuards(AuthGuard('basic'))
@Controller('sa/blogs')
export class SaBlogsController {
  constructor(
    private blogsService: BlogsService,
    private postService: PostsService,
    private blogsQueryRepository: BlogsQueryRepository,
    private usersQueryRepository: UsersQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Post()
  async createBlog(@Body() blog: BlogInputModel) {
    const blogId = await this.commandBus.execute(
      new CreateNewBlogCommand(blog),
    );
    return this.blogsQueryRepository.getBlogById(blogId);
  }

  @Get()
  async getBlogs(
    @Query('searchNameTerm') searchNameTerm: string | null = null,
    @Query() paginatorQuery,
  ) {
    const paginatorParams = castQueryParams(paginatorQuery);
    return await this.blogsQueryRepository.findBlogs(
      paginatorParams,
      searchNameTerm,
      { viewForSa: true },
    );
  }

  @Put(':blogId/bind-with-user/:userId')
  @HttpCode(204)
  async editBlog(
    @Param('blogId') blogId: string,
    @Param('userId') userId: string,
  ) {
    const errors = [];
    if (!(await this.blogsQueryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid blogId');
    }

    if (!(await this.usersQueryRepository.checkUserId(userId))) {
      throw new NotFoundException('Invalid user id');
    }
    const blogOwner = await this.blogsQueryRepository.getBlogOwner(blogId);
    if (blogOwner?.userId) {
      errors.push({ message: WRONG_BLOG_ID, field: 'id' });
    }
    if (errors.length > 0) throw new BadRequestException(errors);
    await this.commandBus.execute(new BindBlogWithUserCommand(blogId, userId));
  }

  @Put(':blogId/ban')
  @HttpCode(204)
  async banBlog(
    @Param('blogId') blogId: string,
    @Body() banStatus: BanBlogInputModel,
  ) {
    if (!(await this.blogsQueryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid user id');
    }
    await this.commandBus.execute(
      new BanBlogCommand(blogId, banStatus.isBanned),
    );
  }
}
