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
  Req,
  UseGuards,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogInputModel } from './dto/blogInputModel';
import { castQueryParams } from '../infrastructure/helpers/helpers';
import { QueryRepository } from '../query/query.repository';
import { PaginatorInputType } from '../api/inputModels/paginatorInputType';
import { PostViewModel } from '../query/viewModels/postViewModel';
import { PaginatorView } from '../query/viewModels/paginatorView';
import { BlogPostInputModel } from './dto/blogPostInputModel';
import { PostsService } from '../posts/posts.service';
import { PostInputModel } from '../posts/dto/postInputModel';
import { ValidateObjectIdTypePipe } from '../api/pipes/validateObjectIdType.pipe';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

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

  @UseGuards(AuthGuard('basic'))
  @Post()
  async createBlog(@Body() blog: BlogInputModel) {
    return await this.blogsService.createNewBlog(blog);
  }

  @Get(':blogId/posts')
  async getPostsForBlog(
    @Param('blogId', ValidateObjectIdTypePipe) blogId: string,
    @Query() query: PaginatorInputType,
    @Req() req: Request,
  ): Promise<PaginatorView<PostViewModel>> {
    if (!(await this.queryRepository.checkBlogId(blogId))) {
      throw new NotFoundException('Invalid blogId');
    }
    const userId = req.user.userId;
    const paginatorParams = castQueryParams(query);
    return await this.queryRepository.findPosts(
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
  async getBlog(@Param('blogId', ValidateObjectIdTypePipe) blogId: string) {
    const blog = await this.queryRepository.getBlogById(blogId);
    if (!blog) {
      throw new NotFoundException('Invalid blogId');
    }
    return blog;
  }

  @UseGuards(AuthGuard('basic'))
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

  @UseGuards(AuthGuard('basic'))
  @Delete(':blogId')
  @HttpCode(204)
  async deleteBlog(@Param('blogId', ValidateObjectIdTypePipe) blogId: string) {
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
