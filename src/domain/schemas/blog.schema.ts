import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BlogViewModel } from '../../infrastructure/viewModels/blogViewModel';
import { BlogInputModel } from '../../application/inputModels/blogInputModel';

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

  getViewModel(): BlogViewModel {
    return {
      id: this._id.toString(),
      name: this.name,
      description: this.description,
      websiteUrl: this.websiteUrl,
      createdAt: this.createdAt.toISOString(),
    };
  }

  changesApply(changes: BlogInputModel) {
    for (const key in changes) {
      this[key] = changes[key];
    }
  }
}
export const BlogSchema = SchemaFactory.createForClass(Blog);
BlogSchema.methods = {
  getViewModel: Blog.prototype.getViewModel,
  changesApply: Blog.prototype.changesApply,
};

export type BlogDocument = HydratedDocument<Blog>;
