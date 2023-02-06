import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BlogInputModel } from '../dto/blogInputModel';
import { AccountData } from '../../users/domain/user.schema';

@Schema()
export class BlogOwnerInfo {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userLogin: string;
}

const BlogOwnerInfoSchema = SchemaFactory.createForClass(BlogOwnerInfo);

@Schema()
export class Blog {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  websiteUrl: string;

  @Prop({ default: new Date() })
  createdAt: Date;

  @Prop({ default: false })
  isMembership: boolean;

  @Prop({ type: BlogOwnerInfoSchema, _id: false })
  blogOwnerInfo: BlogOwnerInfo;

  initial(inputDate: BlogInputModel, userId: string, userLogin: string) {
    this.name = inputDate.name;
    this.websiteUrl = inputDate.websiteUrl;
    this.description = inputDate.description;
    this.createdAt = new Date();
    this.blogOwnerInfo = {
      userId,
      userLogin,
    };
  }

  blogUpdate(changes: BlogInputModel) {
    for (const key in changes) {
      this[key] = changes[key];
    }
  }

  bindUser(userId, userLogin) {
    this.blogOwnerInfo = {
      userId,
      userLogin,
    };
  }
}
export const BlogSchema = SchemaFactory.createForClass(Blog);
BlogSchema.methods = {
  blogUpdate: Blog.prototype.blogUpdate,
  initial: Blog.prototype.initial,
  bindUser: Blog.prototype.bindUser,
};

export type BlogDocument = HydratedDocument<Blog>;
