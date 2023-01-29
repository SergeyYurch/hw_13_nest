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
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PostInputModel } from './dto/postInputModel';
import { QueryRepository } from '../query/query.repository';
import { PostsService } from './posts.service';
import { PaginatorInputType } from '../api/inputModels/paginatorInputType';
import { castQueryParams } from '../infrastructure/helpers/helpers';
import { PostViewModel } from '../query/viewModels/postViewModel';
import { ValidateObjectIdTypePipe } from '../api/pipes/validateObjectIdType.pipe';
import { LikeInputModel } from '../api/inputModels/likeInputModel';
import { AccessTokenGuard } from '../api/guards/access-token.guard';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from '../comments/comments.service';
import { CommentInputModel } from '../comments/dto/commentInputModel';

@Controller('posts')
export class PostsController {
  constructor(
    private queryRepository: QueryRepository,
    private postsService: PostsService,
    private commentService: CommentsService,
  ) {}

  @UseGuards(AccessTokenGuard)
  @Put(':postId/like-status')
  async updatePostLikeStatus(
    @Param('postId', ValidateObjectIdTypePipe) postId: string,
    @Body() likeDto: LikeInputModel,
    @Req() req: Request,
  ) {
    const { userId } = req.user;
    if (!(await this.queryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    await this.postsService.updatePostLikeStatus(
      postId,
      userId,
      likeDto.likeStatus,
    );

    return;
  }

  @Get(':postId/comments')
  async getCommentsForPost(
    @Param('postId', ValidateObjectIdTypePipe) postId: string,
    @Req() req: Request,
    @Query() query: PaginatorInputType,
  ) {
    if (!(await this.queryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    const paginatorParams = castQueryParams(query);
    const { userId } = req.user;
    return this.queryRepository.getCommentsByPostId(
      paginatorParams,
      postId,
      userId,
    );
  }

  @UseGuards(AccessTokenGuard)
  @Post(':postId/comments')
  async createCommentForPost(
    @Param('postId', ValidateObjectIdTypePipe) postId: string,
    @Body() commentDto: CommentInputModel,
    @Req() req: Request,
  ) {
    if (!(await this.queryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    const { userId } = req.user;
    const comment = await this.commentService.createComment(
      commentDto.content,
      userId,
      postId,
    );
    return comment;
  }

  @Get()
  async findPosts(@Query() query: PaginatorInputType) {
    const paginatorParams = castQueryParams(query);
    return await this.queryRepository.findPosts(paginatorParams);
  }

  @Get(':postId')
  async getPost(@Param('postId', ValidateObjectIdTypePipe) postId: string) {
    if (!(await this.queryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    return await this.queryRepository.getPostById(postId);
  }

  @UseGuards(AuthGuard('basic'))
  @Post()
  async createPost(@Body() postDto: PostInputModel): Promise<PostViewModel> {
    if (!(await this.queryRepository.checkBlogId(postDto.blogId))) {
      throw new BadRequestException([
        {
          message: 'Invalid blogId',
          field: 'blogId',
        },
      ]);
    }
    const result = await this.postsService.createNewPost(postDto);
    if (!result) {
      throw new InternalServerErrorException('Server error');
    }
    return result;
  }

  @UseGuards(AuthGuard('basic'))
  @Put(':postId')
  @HttpCode(204)
  async editPost(
    @Param('postId', ValidateObjectIdTypePipe) postId: string,
    @Body() postChanges: PostInputModel,
  ) {
    if (!(await this.queryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    return await this.postsService.editPostById(postId, postChanges);
  }

  @UseGuards(AuthGuard('basic'))
  @Delete(':postId')
  @HttpCode(204)
  async deletePost(@Param('postId', ValidateObjectIdTypePipe) postId: string) {
    if (!(await this.queryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    return await this.postsService.deletePostById(postId);
  }
}
