import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { castQueryParams } from '../common/helpers/helpers';
import { PaginatorInputType } from '../common/inputModels/paginatorInputType';
import { PostViewModel } from '../posts/view-models/postViewModel';
import { PaginatorView } from '../common/view-models/paginatorView';
import { BlogPostInputModel } from './dto/blogPostInputModel';
import { PostsService } from '../posts/posts.service';
import { PostInputModel } from '../posts/dto/postInputModel';
import { ValidateObjectIdTypePipe } from '../common/pipes/validateObjectIdType.pipe';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUserJwtInfo } from '../common/decorators/current-user.param.decorator';
import { JwtPayloadType } from '../auth/types/jwt-payload.type';
import { BlogsQueryRepository } from './blogs.query.repository';
import { PostsQueryRepository } from '../posts/posts.query.repository';

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
  //
  // @UseGuards(AuthGuard('basic'))
  // @Roles(Role.Blogger)
  // @Post()
  // async createBlog(@Body() blog: BlogInputModel) {
  //   return await this.blogsService.createNewBlog(blog);
  // }

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

  @UseGuards(AuthGuard('basic'))
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

  // @UseGuards(AuthGuard('basic'))
  // @Put(':blogId')
  // @HttpCode(204)
  // async editBlog(
  //   @Param('blogId') blogId: string,
  //   @Body() changes: BlogInputModel,
  // ) {
  //   if (!(await this.blogsQueryRepository.checkBlogId(blogId))) {
  //     throw new NotFoundException('Invalid blogId');
  //   }
  //   return await this.blogsService.editBlog(blogId, changes);
  // }

  // @UseGuards(AuthGuard('basic'))
  // @Delete(':blogId')
  // @HttpCode(204)
  // async deleteBlog(@Param('blogId', ValidateObjectIdTypePipe) blogId: string) {
  //   if (!(await this.blogsQueryRepository.checkBlogId(blogId))) {
  //     throw new NotFoundException('Invalid blogId');
  //   }
  //   const result = await this.blogsService.deleteBlog(blogId);
  //   if (!result) {
  //     throw new InternalServerErrorException('Blog not deleted');
  //   }
  //   return;
  // }
}
