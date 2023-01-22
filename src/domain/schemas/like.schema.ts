import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeStatusType } from '../../application/inputModels/likeInputModel';

@Schema()
export class Like {
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
export const LikeSchema = SchemaFactory.createForClass(Like);
