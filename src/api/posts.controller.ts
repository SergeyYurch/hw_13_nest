import {
  Controller,
  Get,
  HttpCode,
  Body,
  Delete,
  Param,
  Post,
  Put,
  Query,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PostInputModel } from '../application/inputModels/postInputModel';
import { QueryRepository } from '../infrastructure/repositories/query.repository';
import { PostsService } from '../application/posts.service';
import { PaginatorInputType } from '../application/inputModels/paginatorInputType';
import { castQueryParams } from '../infrastructure/helpers/helpers';
import { PostViewModel } from '../infrastructure/viewModels/postViewModel';

@Controller('posts')
export class PostsController {
  constructor(
    private queryRepository: QueryRepository,
    private postsService: PostsService,
  ) {}

  @Get(':postId/comments')
  async getCommentsForPost(@Param('postId') postId: string) {
    if (!(await this.queryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    return;
  }

  @Get()
  async findPosts(@Query() query: PaginatorInputType) {
    const paginatorParams = castQueryParams(query);
    return await this.queryRepository.findPosts(paginatorParams);
  }

  @Get(':postId')
  async getPost(@Param('postId') postId: string) {
    if (!(await this.queryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    return await this.queryRepository.getPostById(postId);
  }

  @Post()
  async createPost(@Body() postDto: PostInputModel): Promise<PostViewModel> {
    if (!(await this.queryRepository.checkBlogId(postDto.blogId))) {
      throw new NotFoundException('Invalid blogId');
    }
    const result = await this.postsService.createNewPost(postDto);
    if (!result) {
      throw new InternalServerErrorException('Server error');
    }
    return result;
  }

  @Put(':postId')
  @HttpCode(204)
  async editPost(
    @Param('postId') postId: string,
    @Body() postChanges: PostInputModel,
  ) {
    if (!(await this.queryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    return await this.postsService.editPostById(postId, postChanges);
  }

  @Delete(':postId')
  @HttpCode(204)
  async deletePost(@Param('postId') postId: string) {
    if (!(await this.queryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    return await this.postsService.deletePostById(postId);
  }
}
