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
import { PostViewModel } from '../posts/view-models/postViewModel';
import { BlogPostInputModel } from './dto/blogPostInputModel';
import { PostsService } from '../posts/posts.service';
import { ValidateObjectIdTypePipe } from '../common/pipes/validateObjectIdType.pipe';
import { CurrentUserJwtInfo } from '../common/decorators/current-user.param.decorator';
import { BlogsQueryRepository } from './blogs.query.repository';
import { PostsQueryRepository } from '../posts/posts.query.repository';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CommandBus } from '@nestjs/cqrs';
import { CreateNewBlogCommand } from './use-cases/create-new-blog-use-case';
import { EditBlogCommand } from './use-cases/edit-blog-use-case';
import { DeleteBlogCommand } from './use-cases/delete-blog-use-case';
import { CreateNewPostCommand } from '../posts/use-cases/create-new-post-use-case';
import { EditPostCommand } from '../posts/use-cases/edit-post-use-case';
import { DeletePostCommand } from '../posts/use-cases/delete-post-use-case';

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
    const result = await this.commandBus.execute(
      new EditBlogCommand(userId, blogId, changes),
    );
    if (!result) {
      throw new InternalServerErrorException('Blog not changed');
    }
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

    const result = await this.commandBus.execute(
      new DeleteBlogCommand(userId, blogId),
    );
    if (!result) {
      throw new InternalServerErrorException('Blog not deleted');
    }
  }

  @Post()
  async createBlog(
    @Body() blog: BlogInputModel,
    @CurrentUserJwtInfo() userId: string,
  ) {
    const blogId = await this.commandBus.execute(
      new CreateNewBlogCommand(blog, userId),
    );
    return this.blogsQueryRepository.getBlogById(blogId);
  }

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

  @Post(':blogId/posts')
  async createPostForBlog(
    @CurrentUserJwtInfo() userId: string,
    @Param('blogId', ValidateObjectIdTypePipe) blogId: string,
    @Body() blogPostInputModel: BlogPostInputModel,
  ): Promise<PostViewModel> {
    if (!(await this.blogsQueryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid blogId');
    }
    const postId = await this.commandBus.execute(
      new CreateNewPostCommand(userId, blogId, blogPostInputModel),
    );
    return await this.postsQueryRepository.getPostById(postId);
  }

  @Put(':blogId/posts/:postId')
  @HttpCode(204)
  async editPost(
    @CurrentUserJwtInfo() userId: string,
    @Param('blogId', ValidateObjectIdTypePipe) blogId: string,
    @Param('postId', ValidateObjectIdTypePipe) postId: string,
    @Body() postChanges: BlogPostInputModel,
  ) {
    if (!(await this.blogsQueryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid blogId');
    }
    if (!(await this.postsQueryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    const result = await this.commandBus.execute(
      new EditPostCommand(userId, blogId, postId, postChanges),
    );
    if (!result) {
      throw new InternalServerErrorException('Post not changed');
    }
  }

  @Delete(':blogId/posts/:postId')
  @HttpCode(204)
  async deletePost(
    @CurrentUserJwtInfo() userId: string,
    @Param('blogId', ValidateObjectIdTypePipe) blogId: string,
    @Param('postId', ValidateObjectIdTypePipe) postId: string,
  ) {
    if (!(await this.blogsQueryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid blogId');
    }
    if (!(await this.postsQueryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    const result = await this.commandBus.execute(
      new DeletePostCommand(userId, blogId, postId),
    );
    if (!result) {
      throw new InternalServerErrorException('Post not changed');
    }
  }
}
