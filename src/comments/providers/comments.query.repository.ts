import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { pagesCount } from '../../common/helpers/helpers';
import { PaginatorInputType } from '../../common/dto/input-models/paginator.input.type';
import { LikeStatusType } from '../../common/dto/input-models/like.input.model';
import { Comment, CommentDocument } from '../domain/comment.schema';
import { CommentViewModel } from '../view-models/comment.view.model';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private CommentModel: Model<CommentDocument>,
  ) {}

  async checkCommentId(commentId: string) {
    const comment = await this.CommentModel.findById(commentId);
    return !!comment && !comment.isBanned;
  }

  async getCommentById(commentId: string, userId?: string) {
    const comment = await this.CommentModel.findById(commentId);
    if (!comment || comment.isBanned) return null;
    return this.getCommentViewModel(comment, userId);
  }

  async getCommentsByPostId(
    paginatorParams: PaginatorInputType,
    postId: string,
    userId?: string,
  ) {
    const { sortBy, sortDirection, pageSize, pageNumber } = paginatorParams;
    const totalCount = await this.CommentModel.countDocuments({ postId });
    const comments = await this.CommentModel.find({ postId })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection })
      .exec();
    const items: CommentViewModel[] = [];
    for (const c of comments) {
      if (!c.isBanned) items.push(this.getCommentViewModel(c, userId));
    }

    return {
      pagesCount: pagesCount(totalCount, pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  getCommentViewModel(
    comment: CommentDocument,
    userId?: string,
  ): CommentViewModel {
    let likesCount = 0;
    let dislikesCount = 0;
    let myStatus: LikeStatusType = 'None';
    if (comment.likes.length > 0) {
      likesCount = comment.likes.filter(
        (c) => c.likeStatus === 'Like' && !c.userIsBanned,
      ).length;
      dislikesCount = comment.likes.filter(
        (c) => c.likeStatus === 'Dislike' && !c.userIsBanned,
      ).length;
      if (userId) {
        const myLike = comment.likes.find((l) => l.userId === userId);
        if (myLike) myStatus = myLike.likeStatus;
      }
    }
    return {
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt.toISOString(),
      likesInfo: {
        likesCount,
        dislikesCount,
        myStatus,
      },
    };
  }
}
