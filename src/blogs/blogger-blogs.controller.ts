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
import { BlogsService } from './blogs.service';
import { BlogInputModel } from './dto/blogInputModel';
import { castQueryParams } from '../common/helpers/helpers';
import { PaginatorInputType } from '../common/inputModels/paginatorInputType';
import { PostViewModel } from '../posts/view-models/postViewModel';
import { PaginatorView } from '../common/view-models/paginatorView';
import { BlogPostInputModel } from './dto/blogPostInputModel';
import { PostsService } from '../posts/posts.service';
import { PostInputModel } from '../posts/dto/postInputModel';
import { ValidateObjectIdTypePipe } from '../common/pipes/validateObjectIdType.pipe';
import { CurrentUserJwtInfo } from '../common/decorators/current-user.param.decorator';
import { JwtPayloadType } from '../auth/types/jwt-payload.type';
import { BlogsQueryRepository } from './blogs.query.repository';
import { PostsQueryRepository } from '../posts/posts.query.repository';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CommandBus } from '@nestjs/cqrs';
import { CreateNewBlogCommand } from './use-cases/create-new-blog-use-case';
import { EditBlogCommand } from './use-cases/edit-blog-use-case';
import { DeleteBlogCommand } from './use-cases/delete-blog-use-case';

@UseGuards(AccessTokenGuard)
@Controller('blogger/blogs')
export class BloggerBlogsController {
  constructor(
    private blogsService: BlogsService,
    private postService: PostsService,
    private blogsQueryRepository: BlogsQueryRepository,
    private postsQueryRepository: PostsQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Get()
  async getBlogs(
    @Query('searchNameTerm') searchNameTerm: string | null = null,
    @Query() query,
    @CurrentUserJwtInfo() userId: string,
  ) {
    const paginatorParams = castQueryParams(query);
    return await this.blogsQueryRepository.findBlogs(
      paginatorParams,
      searchNameTerm,
      { userId },
    );
  }

  // @Roles(Role.Blogger)
  @Post()
  async createBlog(
    @Body() blog: BlogInputModel,
    @CurrentUserJwtInfo() userId: string,
  ) {
    return await this.commandBus.execute(
      new CreateNewBlogCommand(blog, userId),
    );
  }

  @Put(':blogId')
  @HttpCode(204)
  async editBlog(
    @Param('blogId') blogId: string,
    @Body() changes: BlogInputModel,
    @CurrentUserJwtInfo() userId: string,
  ) {
    if (!(await this.blogsQueryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid blogId');
    }
    await this.blogsService.checkBlogOwner(blogId, userId);
    await this.commandBus.execute(new EditBlogCommand(blogId, changes));
  }

  @Delete(':blogId')
  @HttpCode(204)
  async deleteBlog(
    @CurrentUserJwtInfo() userId: string,
    @Param('blogId', ValidateObjectIdTypePipe) blogId: string,
  ) {
    if (!(await this.blogsQueryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid blogId');
    }
    await this.blogsService.checkBlogOwner(blogId, userId);

    const result = await this.commandBus.execute(new DeleteBlogCommand(blogId));
    if (!result) {
      throw new InternalServerErrorException('Blog not deleted');
    }
    return;
  }

  @Get(':blogId/posts')
  async getPostsForBlog(
    @Param('blogId', ValidateObjectIdTypePipe) blogId: string,
    @Query() query: PaginatorInputType,
    @CurrentUserJwtInfo() userInfo: JwtPayloadType,
  ): Promise<PaginatorView<PostViewModel>> {
    if (!(await this.blogsQueryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid blogId');
    }
    const userId = userInfo.userId;
    const paginatorParams = castQueryParams(query);
    return await this.postsQueryRepository.findPosts(
      paginatorParams,
      blogId,
      userId,
    );
  }

  @Post(':blogId/posts')
  async createPostForBlog(
    @Param('blogId', ValidateObjectIdTypePipe) blogId: string,
    @Body() blogPostDto: BlogPostInputModel,
  ): Promise<PostViewModel> {
    if (!(await this.blogsQueryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid blogId');
    }
    const createdPost: PostInputModel = {
      title: blogPostDto.title,
      shortDescription: blogPostDto.shortDescription,
      content: blogPostDto.content,
      blogId,
    };
    return this.postService.createNewPost(createdPost);
  }

  @Get(':blogId')
  async getBlog(@Param('blogId', ValidateObjectIdTypePipe) blogId: string) {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);
    if (!blog) {
      throw new NotFoundException('Invalid blogId');
    }
    return blog;
  }
}
