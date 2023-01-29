import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeStatusType } from '../../api/inputModels/likeInputModel';

@Schema()
export class CommentsLike {
  @Prop({ required: true })
  userId: string;

  @Prop()
  login: string;

  @Prop({ required: false })
  userBan: boolean;

  @Prop({ required: true })
  likeStatus: LikeStatusType;

  @Prop({ required: true, default: new Date() })
  addedAt: Date;
}
export const CommentsLikeSchema = SchemaFactory.createForClass(CommentsLike);
