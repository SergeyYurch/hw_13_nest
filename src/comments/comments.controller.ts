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
import { CurrentUserJwtInfo } from '../common/decorators/current-user.param.decorator';
import { JwtPayloadType } from '../auth/types/jwt-payload.type';
import { CommentsQueryRepository } from './comments.query.repository';

@Controller('comments')
export class CommentsController {
  constructor(
    private commentsQueryRepository: CommentsQueryRepository,
    private commentService: CommentsService,
  ) {}

  @Get(':commentId')
  async getCommentsForPost(
    @Param('commentId', ValidateObjectIdTypePipe) commentId: string,
    @CurrentUserJwtInfo() userInfo: JwtPayloadType,
  ) {
    if (!(await this.commentsQueryRepository.checkCommentId(commentId))) {
      throw new NotFoundException('Invalid postID');
    }
    const userId = userInfo?.userId;
    return this.commentsQueryRepository.getCommentsById(commentId, userId);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(204)
  @Delete(':commentId')
  async delete(
    @Param('commentId', ValidateObjectIdTypePipe) commentId: string,
    @CurrentUserJwtInfo() userInfo: JwtPayloadType,
  ) {
    if (!(await this.commentsQueryRepository.checkCommentId(commentId))) {
      throw new NotFoundException('Invalid postID');
    }
    const userId = userInfo.userId;
    await this.commentService.validateOwner(commentId, userId);

    await this.commentService.deleteComment(commentId);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(204)
  @Put(':commentId')
  async update(
    @Param('commentId', ValidateObjectIdTypePipe) commentId: string,
    @Body() commentDto: CommentInputModel,
    @CurrentUserJwtInfo() userInfo: JwtPayloadType,
  ) {
    if (!(await this.commentsQueryRepository.checkCommentId(commentId))) {
      throw new NotFoundException('Invalid postID');
    }
    const userId = userInfo.userId;
    await this.commentService.validateOwner(commentId, userId);
    await this.commentService.updateComment(commentId, commentDto, userId);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(204)
  @Put(':commentId/like-status')
  async updateLikeStatus(
    @Param('commentId', ValidateObjectIdTypePipe) commentId: string,
    @Body() likeDto: LikeInputModel,
    @CurrentUserJwtInfo() userInfo: JwtPayloadType,
  ) {
    if (!(await this.commentsQueryRepository.checkCommentId(commentId))) {
      throw new NotFoundException('Invalid postID');
    }
    const userId = userInfo.userId;
    return this.commentService.updateLikeStatus(
      commentId,
      userId,
      likeDto.likeStatus,
    );
  }
}
