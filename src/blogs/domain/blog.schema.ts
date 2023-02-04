import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BlogInputModel } from '../dto/blogInputModel';

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

  initial(inputDate: BlogInputModel) {
    this.name = inputDate.name;
    this.websiteUrl = inputDate.websiteUrl;
    this.description = inputDate.description;
    this.createdAt = new Date();
  }

  blogUpdate(changes: BlogInputModel) {
    for (const key in changes) {
      this[key] = changes[key];
    }
  }
}
export const BlogSchema = SchemaFactory.createForClass(Blog);
BlogSchema.methods = {
  blogUpdate: Blog.prototype.blogUpdate,
  initial: Blog.prototype.initial,
};

export type BlogDocument = HydratedDocument<Blog>;
