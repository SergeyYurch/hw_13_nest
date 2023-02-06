import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { pagesCount } from '../common/helpers/helpers';
import { PaginatorInputType } from '../common/inputModels/paginatorInputType';
import { LikeStatusType } from '../common/inputModels/likeInputModel';
import { Comment, CommentDocument } from './domain/comment.schema';
import { CommentViewModel } from './view-models/commentViewModel';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private CommentModel: Model<CommentDocument>,
  ) {}

  async checkCommentId(commentId: string) {
    return !!(await this.CommentModel.findById(commentId));
  }

  async getCommentsById(commentId: string, userId?: string) {
    const comment = await this.CommentModel.findById(commentId);
    if (!comment) return null;
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
      .sort({ [sortBy]: sortDirection });
    const items: CommentViewModel[] = comments.map((c) =>
      this.getCommentViewModel(c, userId),
    );

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
      likesCount = comment.likes.filter((c) => c.likeStatus === 'Like').length;
      dislikesCount = comment.likes.filter(
        (c) => c.likeStatus === 'Dislike',
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
