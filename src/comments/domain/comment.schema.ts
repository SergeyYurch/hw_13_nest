import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CommentsLike, CommentsLikeSchema } from './comments-like.schema';
import { LikeStatusType } from '../../common/inputModels/likeInputModel';

@Schema()
export class Comment {
  _id: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  postId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userLogin: string;

  @Prop({ default: false })
  isBanned: boolean;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ type: [CommentsLikeSchema], default: [] })
  likes: CommentsLike[];

  initial(content: string, userId: string, userLogin: string, postId: string) {
    this.content = content;
    this.postId = postId;
    this.userId = userId;
    this.userLogin = userLogin;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  updateContent(content: string) {
    this.content = content;
    this.updatedAt = new Date();
  }

  banComment(isBanned: boolean) {
    this.isBanned = isBanned;
  }
  updateLikeStatus(userId: string, likeStatus: LikeStatusType) {
    const existingLikeItem = this.likes.find((l) => l.userId === userId);
    if (!existingLikeItem) {
      this.likes.push({
        userId,
        likeStatus,
        addedAt: new Date(),
        updatedAt: new Date(),
        userIsBanned: false,
      });
      return;
    }
    existingLikeItem.likeStatus = likeStatus;
    existingLikeItem.updatedAt = new Date();
    this.likes = this.likes.map((l) =>
      l.userId === userId ? existingLikeItem : l,
    );
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.methods = {
  initial: Comment.prototype.initial,
  updateContent: Comment.prototype.updateContent,
  updateLikeStatus: Comment.prototype.updateLikeStatus,
  banComment: Comment.prototype.banComment,
};
export type CommentDocument = HydratedDocument<Comment>;
