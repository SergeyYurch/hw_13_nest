import { PostViewModel } from '../infrastructure/viewModels/postViewModel';
import { PostInputModel } from './inputModels/postInputModel';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from '../domain/schemas/post.schema';
import { Model, Types } from 'mongoose';
import { PostsRepository } from '../infrastructure/repositories/posts.repository';
import { Blog, BlogDocument } from '../domain/schemas/blog.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private PostModel: Model<PostDocument>,
    @InjectModel(Blog.name) private BlogModel: Model<BlogDocument>,
    private postRepository: PostsRepository,
  ) {}

  async createNewPost(postDto: PostInputModel): Promise<PostViewModel | null> {
    const createdPost = new this.PostModel(postDto);
    const blogInDb = await this.BlogModel.findById(postDto.blogId);
    createdPost.blogName = blogInDb.name;
    const result = await this.postRepository.save(createdPost);
    if (!postDto) return null;
    return result.getViewModel();
  }

  async editPostById(
    postId: string,
    postChanges: PostInputModel,
  ): Promise<boolean> {
    const postInDd = await this.PostModel.findById(postId);
    postInDd.title = postChanges.title;
    postInDd.shortDescription = postChanges.shortDescription;
    postInDd.content = postChanges.content;
    postInDd.blogId = postChanges.blogId;
    const result = await this.postRepository.save(postInDd);
    return !!result;
  }

  async deletePostById(postId: string): Promise<boolean> {
    const result = await this.PostModel.deleteOne({
      _id: new Types.ObjectId(postId),
    });
    return result.deletedCount === 1;
  }
}
