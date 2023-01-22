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
} from '@nestjs/common';
import { BlogsService } from '../application/blogs.service';
import { BlogInputModel } from '../application/inputModels/blogInputModel';
import { castQueryParams } from '../infrastructure/helpers/helpers';
import { QueryRepository } from '../infrastructure/repositories/query.repository';
import { PaginatorInputType } from '../application/inputModels/paginatorInputType';
import { PostViewModel } from '../infrastructure/viewModels/postViewModel';
import { PaginatorView } from '../infrastructure/viewModels/paginatorView';
import { BlogPostInputModel } from '../application/inputModels/blogPostInputModel';
import { PostsService } from '../application/posts.service';
import { PostInputModel } from '../application/inputModels/postInputModel';

@Controller('blogs')
export class BlogsController {
  constructor(
    private blogsService: BlogsService,
    private postService: PostsService,
    private queryRepository: QueryRepository,
  ) {}
  @Get()
  async getBlogs(
    @Query('searchNameTerm') searchNameTerm: string | null = null,
    @Query() query,
  ) {
    const paginatorParams = castQueryParams(query);
    return await this.queryRepository.findBlogs(
      paginatorParams,
      searchNameTerm,
    );
  }

  @Post()
  async createBlog(@Body() blog: BlogInputModel) {
    return await this.blogsService.createNewBlog(blog);
  }

  @Get(':blogId/posts')
  async getPostsForBlog(
    @Param('blogId') blogId: string,
    @Query() query: PaginatorInputType,
  ): Promise<PaginatorView<PostViewModel>> {
    if (!(await this.queryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid blogId');
    }
    return await this.queryRepository.findPosts(query, blogId);
  }

  @Post(':blogId/posts')
  async createPostForBlog(
    @Param('blogId') blogId: string,
    @Body() blogPostDto: BlogPostInputModel,
  ): Promise<PostViewModel> {
    if (!(await this.queryRepository.checkBlogId(blogId))) {
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
  async getBlog(@Param('blogId') blogId: string) {
    const blog = await this.queryRepository.getBlogById(blogId);
    if (!blog) {
      throw new NotFoundException('Invalid blogId');
    }
    return blog;
  }

  @Put(':blogId')
  @HttpCode(204)
  async editBlog(
    @Param('blogId') blogId: string,
    @Body() changes: BlogInputModel,
  ) {
    if (!(await this.queryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid blogId');
    }
    return await this.blogsService.editBlog(blogId, changes);
  }

  @Delete(':blogId')
  @HttpCode(204)
  async deleteBlog(@Param('blogId') blogId: string) {
    if (!(await this.queryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid blogId');
    }
    const result = await this.blogsService.deleteBlog(blogId);
    if (!result) {
      throw new InternalServerErrorException('Blog not deleted');
    }
    return;
  }
}
