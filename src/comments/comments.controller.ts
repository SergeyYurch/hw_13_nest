import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { ValidateObjectIdTypePipe } from '../common/pipes/validateObjectIdType.pipe';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CommentInputModel } from './dto/commentInputModel';
import { LikeInputModel } from '../common/inputModels/likeInputModel';
import { CommentsQueryRepository } from './comments.query.repository';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteCommentCommand } from './use-cases/delete-comment-use-case';
import { UpdateCommentCommand } from './use-cases/update-comment-use-case';
import { UpdateLikeStatusCommand } from './use-cases/update-like-status-use-case';
import { CurrentUserId } from '../common/decorators/current-user-id.param.decorator';

@Controller('comments')
export class CommentsController {
  constructor(
    private commentsQueryRepository: CommentsQueryRepository,
    private commentService: CommentsService,
    private commandBus: CommandBus,
  ) {}

  @Get(':commentId')
  async getCommentsForPost(
    @Param('commentId', ValidateObjectIdTypePipe) commentId: string,
    @CurrentUserId() userId: string,
  ) {
    if (!(await this.commentsQueryRepository.checkCommentId(commentId))) {
      throw new NotFoundException('Invalid postID');
    }
    return this.commentsQueryRepository.getCommentById(commentId, userId);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(204)
  @Delete(':commentId')
  async delete(
    @Param('commentId', ValidateObjectIdTypePipe) commentId: string,
    @CurrentUserId() userId: string,
  ) {
    if (!(await this.commentsQueryRepository.checkCommentId(commentId))) {
      throw new NotFoundException('Invalid postID');
    }
    await this.commentService.validateOwner(commentId, userId);

    await this.commandBus.execute(new DeleteCommentCommand(commentId));
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(204)
  @Put(':commentId')
  async update(
    @Param('commentId', ValidateObjectIdTypePipe) commentId: string,
    @Body() commentDto: CommentInputModel,
    @CurrentUserId() userId: string,
  ) {
    if (!(await this.commentsQueryRepository.checkCommentId(commentId))) {
      throw new NotFoundException('Invalid postID');
    }
    await this.commentService.validateOwner(commentId, userId);
    await this.commandBus.execute(
      new UpdateCommentCommand(commentId, commentDto, userId),
    );
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(204)
  @Put(':commentId/like-status')
  async updateLikeStatus(
    @Param('commentId', ValidateObjectIdTypePipe) commentId: string,
    @Body() likeDto: LikeInputModel,
    @CurrentUserId() userId: string,
  ) {
    if (!(await this.commentsQueryRepository.checkCommentId(commentId))) {
      throw new NotFoundException('Invalid postID');
    }
    return this.commandBus.execute(
      new UpdateLikeStatusCommand(commentId, userId, likeDto.likeStatus),
    );
  }
}
