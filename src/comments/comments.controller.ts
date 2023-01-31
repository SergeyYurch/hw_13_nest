import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { QueryRepository } from '../query/query.repository';
import { CommentsService } from './comments.service';
import { ValidateObjectIdTypePipe } from '../api/pipes/validateObjectIdType.pipe';
import { Request } from 'express';
import { AccessTokenGuard } from '../api/guards/access-token.guard';
import { CommentInputModel } from './dto/commentInputModel';
import { LikeInputModel } from '../api/inputModels/likeInputModel';

@Controller('comments')
export class CommentsController {
  constructor(
    private queryRepository: QueryRepository,
    private commentService: CommentsService,
  ) {}

  //{host}
  @Get(':commentId')
  async getCommentsForPost(
    @Param('commentId', ValidateObjectIdTypePipe) commentId: string,
    @Req() req: Request,
  ) {
    if (!(await this.queryRepository.checkCommentId(commentId))) {
      throw new NotFoundException('Invalid postID');
    }
    const userId = req.user?.userId;
    return this.queryRepository.getCommentsById(commentId, userId);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(204)
  @Delete(':commentId')
  async delete(
    @Param('commentId', ValidateObjectIdTypePipe) commentId: string,
    @Req() req: Request,
  ) {
    if (!(await this.queryRepository.checkCommentId(commentId))) {
      throw new NotFoundException('Invalid postID');
    }
    const userId = req.user.userId;
    await this.commentService.validateOwner(commentId, userId);

    await this.commentService.deleteComment(commentId);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(204)
  @Put(':commentId')
  async update(
    @Param('commentId', ValidateObjectIdTypePipe) commentId: string,
    @Body() commentDto: CommentInputModel,
    @Req() req: Request,
  ) {
    if (!(await this.queryRepository.checkCommentId(commentId))) {
      throw new NotFoundException('Invalid postID');
    }
    const userId = req.user.userId;
    await this.commentService.validateOwner(commentId, userId);
    await this.commentService.updateComment(commentId, commentDto, userId);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(204)
  @Put(':commentId/like-status')
  async updateLikeStatus(
    @Param('commentId', ValidateObjectIdTypePipe) commentId: string,
    @Body() likeDto: LikeInputModel,
    @Req() req: Request,
  ) {
    if (!(await this.queryRepository.checkCommentId(commentId))) {
      throw new NotFoundException('Invalid postID');
    }
    const userId = req.user.userId;
    return this.commentService.updateLikeStatus(
      commentId,
      userId,
      likeDto.likeStatus,
    );
  }
}
