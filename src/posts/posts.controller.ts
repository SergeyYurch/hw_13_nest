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
  UseGuards,
  Req,
} from '@nestjs/common';
import { PostInputModel } from './dto/postInputModel';
import { PostsService } from './posts.service';
import { PaginatorInputType } from '../common/inputModels/paginatorInputType';
import { castQueryParams } from '../common/helpers/helpers';
import { PostViewModel } from './view-models/postViewModel';
import { ValidateObjectIdTypePipe } from '../common/pipes/validateObjectIdType.pipe';
import { LikeInputModel } from '../common/inputModels/likeInputModel';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from '../comments/comments.service';
import { CommentInputModel } from '../comments/dto/commentInputModel';
import { PostsQueryRepository } from './posts.query.repository';
import { CommentsQueryRepository } from '../comments/comments.query.repository';

@Controller('posts')
export class PostsController {
  constructor(
    private postsQueryRepository: PostsQueryRepository,
    private commentsQueryRepository: CommentsQueryRepository,
    private postsService: PostsService,
    private commentService: CommentsService,
  ) {}

  @UseGuards(AccessTokenGuard)
  @HttpCode(204)
  @Put(':postId/like-status')
  async updatePostLikeStatus(
    @Param('postId', ValidateObjectIdTypePipe) postId: string,
    @Body() likeDto: LikeInputModel,
    @Req() req: Request,
  ) {
    const userId = req.user.userId;
    if (!(await this.postsQueryRepository.checkPostId(postId))) {
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
    if (!(await this.postsQueryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    const paginatorParams = castQueryParams(query);
    const userId = req.user?.userId;
    return this.commentsQueryRepository.getCommentsByPostId(
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
    if (!(await this.postsQueryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    const userId = req.user?.userId;
    return await this.commentService.createComment(
      commentDto.content,
      userId,
      postId,
    );
  }

  @Get()
  async findPosts(@Query() query: PaginatorInputType, @Req() req: Request) {
    const paginatorParams = castQueryParams(query);
    const userId = req.user?.userId;
    return await this.postsQueryRepository.findPosts(
      paginatorParams,
      null,
      userId,
    );
  }

  @Get(':postId')
  async getPost(
    @Param('postId', ValidateObjectIdTypePipe) postId: string,
    @Req() req: Request,
  ) {
    if (!(await this.postsQueryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    const userId = req.user?.userId;
    return await this.postsQueryRepository.getPostById(postId, userId);
  }

  @UseGuards(AuthGuard('basic'))
  @Post()
  async createPost(@Body() postDto: PostInputModel): Promise<PostViewModel> {
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
    if (!(await this.postsQueryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    return await this.postsService.editPostById(postId, postChanges);
  }

  @UseGuards(AuthGuard('basic'))
  @Delete(':postId')
  @HttpCode(204)
  async deletePost(@Param('postId', ValidateObjectIdTypePipe) postId: string) {
    if (!(await this.postsQueryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    return await this.postsService.deletePostById(postId);
  }
}
