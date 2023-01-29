import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CommentsLike, CommentsLikeSchema } from './comments-like.schema';

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
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.methods = {
  initial: Comment.prototype.initial,
};
export type CommentDocument = HydratedDocument<Comment>;
