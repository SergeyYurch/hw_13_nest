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
import { BlogsService } from './providers/blogs.service';
import { BlogInputModel } from './dto/input-models/blog.input.model';
import { castQueryParams } from '../common/helpers/helpers';
import { PostViewModel } from '../posts/dto/view-models/post.view.model';
import { BlogPostInputModel } from './dto/input-models/blog-post.input.model';
import { PostsService } from '../posts/providers/posts.service';
import { ValidateObjectIdTypePipe } from '../common/pipes/validate-object-id-type.pipe';
import { BlogsQueryRepository } from './providers/blogs.query.repository';
import { PostsQueryRepository } from '../posts/providers/posts.query.repository';
import { CommandBus } from '@nestjs/cqrs';
import { CreateNewBlogCommand } from './providers/use-cases/create-new-blog-use-case';
import { EditBlogCommand } from './providers/use-cases/edit-blog-use-case';
import { DeleteBlogCommand } from './providers/use-cases/delete-blog-use-case';
import { CreateNewPostCommand } from '../posts/providers/use-cases/create-new-post-use-case';
import { EditPostCommand } from '../posts/providers/use-cases/edit-post-use-case';
import { DeletePostCommand } from '../posts/providers/use-cases/delete-post-use-case';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.param.decorator';
import { CommentsQueryRepository } from '../comments/providers/comments.query.repository';

@UseGuards(AccessTokenGuard)
@Controller('blogger/blogs')
export class BloggerBlogsController {
  constructor(
    private blogsService: BlogsService,
    private postService: PostsService,
    private blogsQueryRepository: BlogsQueryRepository,
    private postsQueryRepository: PostsQueryRepository,
    private commentsQueryRepository: CommentsQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Get('comments')
  async getComments(@Query() query, @CurrentUserId() bloggerId: string) {
    const paginatorParams = castQueryParams(query);
    return await this.commentsQueryRepository.getBloggersComments(
      paginatorParams,
      bloggerId,
    );
  }

  @Put(':blogId')
  @HttpCode(204)
  async editBlog(
    @Param('blogId', ValidateObjectIdTypePipe) blogId: string,
    @Body() changes: BlogInputModel,
    @CurrentUserId() userId: string,
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
    @CurrentUserId() userId: string,
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
    @CurrentUserId() userId: string,
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
    @CurrentUserId() userId: string,
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
    @CurrentUserId() userId: string,
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
    @CurrentUserId() userId: string,
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
    await this.commandBus.execute(
      new EditPostCommand(userId, blogId, postId, postChanges),
    );
  }

  @Delete(':blogId/posts/:postId')
  @HttpCode(204)
  async deletePost(
    @CurrentUserId() userId: string,
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
