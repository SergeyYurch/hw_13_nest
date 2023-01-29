import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeStatusType } from '../../api/inputModels/likeInputModel';
import { LikeForPost, LikeForPostSchema } from './like-for-post.schema';

@Schema()
export class Post {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  shortDescription: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  blogId: string;

  @Prop({ required: true })
  blogName: string;

  @Prop({ default: new Date() })
  createdAt: Date;

  @Prop({ type: [LikeForPostSchema], default: [] })
  likes: LikeForPost[];

  initial() {
    return;
  }

  updateLikeStatus(userId: string, login: string, likeStatus: LikeStatusType) {
    const existingLikeItem = this.likes.find((l) => l.userId === userId);
    if (!existingLikeItem) {
      this.likes.push({
        userId,
        login,
        likeStatus,
        addedAt: new Date(),
        updatedAt: new Date(),
        userBan: false,
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
export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.methods = {
  initial: Post.prototype.initial,
  updateLikeStatus: Post.prototype.updateLikeStatus,
};

export type PostDocument = HydratedDocument<Post>;
