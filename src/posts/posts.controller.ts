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
  ForbiddenException,
} from '@nestjs/common';
import { PaginatorInputType } from '../common/dto/input-models/paginator.input.type';
import { castQueryParams } from '../common/helpers/helpers';
import { ValidateObjectIdTypePipe } from '../common/pipes/validate-object-id-type.pipe';
import { LikeInputModel } from '../common/dto/input-models/like.input.model';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { Request } from 'express';
import { CommentInputModel } from '../comments/dto/comment-input.model';
import { PostsQueryRepository } from './providers/posts.query.repository';
import { CommentsQueryRepository } from '../comments/providers/comments.query.repository';
import { CommandBus } from '@nestjs/cqrs';
import { UpdatePostLikeStatusCommand } from './providers/use-cases/update-post-like-status-use-case';
import { CreateCommentCommand } from '../comments/providers/use-cases/create-comment-use-case';
import { CurrentUserId } from '../common/decorators/current-user-id.param.decorator';
import { PostsService } from './providers/posts.service';

@Controller('posts')
export class PostsController {
  constructor(
    private postsQueryRepository: PostsQueryRepository,
    private commentsQueryRepository: CommentsQueryRepository,
    private postsService: PostsService,
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
      { userId },
    );
  }

  //Create comment for a specific post
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
    const access = await this.postsService.accessCheck(userId, postId);
    if (access === 'forbidden') {
      throw new ForbiddenException('BAN');
    }
    const commentId = await this.commandBus.execute(
      new CreateCommentCommand(commentDto.content, userId, postId),
    );
    return this.commentsQueryRepository.getCommentById(commentId, { userId });
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
