import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { castQueryParams } from '../common/helpers/helpers';
import { PaginatorInputType } from '../common/inputModels/paginatorInputType';
import { PostViewModel } from '../posts/view-models/postViewModel';
import { PaginatorView } from '../common/view-models/paginatorView';
import { PostsService } from '../posts/posts.service';
import { ValidateObjectIdTypePipe } from '../common/pipes/validateObjectIdType.pipe';
import { BlogsQueryRepository } from './blogs.query.repository';
import { PostsQueryRepository } from '../posts/posts.query.repository';
import { CurrentUserId } from '../common/decorators/current-user-id.param.decorator';

@Controller('blogs')
export class BlogsController {
  constructor(
    private blogsService: BlogsService,
    private postService: PostsService,
    private blogsQueryRepository: BlogsQueryRepository,
    private postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async getBlogs(
    @Query('searchNameTerm') searchNameTerm: string | null = null,
    @Query() query,
  ) {
    const paginatorParams = castQueryParams(query);
    return await this.blogsQueryRepository.findBlogs(
      paginatorParams,
      searchNameTerm,
    );
  }

  @Get(':blogId/posts')
  async getPostsForBlog(
    @Param('blogId', ValidateObjectIdTypePipe) blogId: string,
    @Query() query: PaginatorInputType,
    @CurrentUserId() userId: string,
  ): Promise<PaginatorView<PostViewModel>> {
    if (!(await this.blogsQueryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid blogId');
    }
    const paginatorParams = castQueryParams(query);
    return await this.postsQueryRepository.findPosts(
      paginatorParams,
      blogId,
      userId,
    );
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
