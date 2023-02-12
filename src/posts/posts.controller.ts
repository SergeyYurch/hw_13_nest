import {
  Controller,
  Get,
  HttpCode,
  Body,
  Param,
  Post,
  Put,
  Query,
  NotFoundException,
  InternalServerErrorException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaginatorInputType } from '../common/inputModels/paginatorInputType';
import { castQueryParams } from '../common/helpers/helpers';
import { ValidateObjectIdTypePipe } from '../common/pipes/validateObjectIdType.pipe';
import { LikeInputModel } from '../common/inputModels/likeInputModel';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { Request } from 'express';
import { CommentInputModel } from '../comments/dto/commentInputModel';
import { PostsQueryRepository } from './posts.query.repository';
import { CommentsQueryRepository } from '../comments/comments.query.repository';
import { CommandBus } from '@nestjs/cqrs';
import { UpdatePostLikeStatusCommand } from './use-cases/update-post-like-status-use-case';
import { CreateCommentCommand } from '../comments/use-cases/create-comment-use-case';
import { CurrentUserId } from '../common/decorators/current-user-id.param.decorator';

@Controller('posts')
export class PostsController {
  constructor(
    private postsQueryRepository: PostsQueryRepository,
    private commentsQueryRepository: CommentsQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @UseGuards(AccessTokenGuard)
  @HttpCode(204)
  @Put(':postId/like-status')
  async updatePostLikeStatus(
    @Param('postId', ValidateObjectIdTypePipe) postId: string,
    @Body() likeDto: LikeInputModel,
    @CurrentUserId() userId: string,
  ) {
    if (!(await this.postsQueryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }

    const result = await this.commandBus.execute(
      new UpdatePostLikeStatusCommand(postId, userId, likeDto.likeStatus),
    );
    if (!result) {
      throw new InternalServerErrorException('Blog not changed');
    }
  }

  @Get(':postId/comments')
  async getCommentsForPost(
    @Param('postId', ValidateObjectIdTypePipe) postId: string,
    @Query() query: PaginatorInputType,
    @CurrentUserId() userId: string,
  ) {
    if (!(await this.postsQueryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    const paginatorParams = castQueryParams(query);
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
    @CurrentUserId() userId: string,
  ) {
    if (!(await this.postsQueryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    const commentId = await this.commandBus.execute(
      new CreateCommentCommand(commentDto.content, userId, postId),
    );
    return this.commentsQueryRepository.getCommentById(commentId, userId);
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
    @CurrentUserId() userId: string,
  ) {
    if (!(await this.postsQueryRepository.checkPostId(postId))) {
      throw new NotFoundException('Invalid postID');
    }
    return await this.postsQueryRepository.getPostById(postId, userId);
  }
}
