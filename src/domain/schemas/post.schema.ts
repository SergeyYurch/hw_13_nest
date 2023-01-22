import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Like, LikeSchema } from './like.schema';
import { PostViewModel } from '../../infrastructure/viewModels/postViewModel';
import { LikeStatusType } from '../../application/inputModels/likeInputModel';

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

  @Prop({ type: [LikeSchema], default: [] })
  likes: Like[];

  getViewModel(userId?: string): PostViewModel {
    const likes = this.likes.filter(
      (l) => l.likeStatus === 'Like' && !l.userBan,
    );
    const likesCount = likes.length;
    const dislike = this.likes.filter(
      (l) => l.likeStatus === 'Dislike' && !l.userBan,
    );
    const dislikesCount = dislike.length;
    likes.sort((l1, l2) => {
      if (l1.addedAt < l2.addedAt) return -1;
      if (l1.addedAt < l2.addedAt) return 1;
      return 0;
    });
    const lastLikes = likes.slice(0, 3);
    const newestLikes = lastLikes.map((l) => ({
      addedAt: l.addedAt.toISOString(),
      userId: l.userId,
      login: l.login,
    }));
    let myStatus: LikeStatusType = 'None';
    if (userId) {
      const myLike = this.likes.find((l) => l.userId === userId);
      if (myLike) myStatus = myLike.likeStatus;
    }
    return {
      id: this._id.toString(),
      title: this.title,
      shortDescription: this.shortDescription,
      content: this.content,
      blogId: this.blogId,
      blogName: this.blogName,
      createdAt: this.createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount,
        dislikesCount,
        myStatus,
        newestLikes,
      },
    };
  }
}
export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.methods = {
  getViewModel: Post.prototype.getViewModel,
};

export type PostDocument = HydratedDocument<Post>;
