import { PostViewModel } from './view-models/postViewModel';
import { PostInputModel } from './dto/postInputModel';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from './domain/post.schema';
import { Model, Types } from 'mongoose';
import { PostsRepository } from './posts.repository';
import { Blog, BlogDocument } from '../blogs/domain/blog.schema';
import { LikeStatusType } from '../common/inputModels/likeInputModel';
import { PostsQueryRepository } from './posts.query.repository';
import { UsersQueryRepository } from '../users/users.query.repository';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private PostModel: Model<PostDocument>,
    @InjectModel(Blog.name) private BlogModel: Model<BlogDocument>,
    private postRepository: PostsRepository,
    private postsQueryRepository: PostsQueryRepository,
    private usersQueryRepository: UsersQueryRepository,
  ) {}

  async createNewPost(postDto: PostInputModel): Promise<PostViewModel | null> {
    const createdPost = new this.PostModel(postDto);
    const blogInDb = await this.BlogModel.findById(postDto.blogId);
    createdPost.blogName = blogInDb.name;
    createdPost.createdAt = new Date();
    const result = await this.postRepository.save(createdPost);
    if (!postDto) return null;
    return this.postsQueryRepository.getPostViewModel(result);
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

  async updatePostLikeStatus(
    postId: string,
    userId: string,
    likeStatus: LikeStatusType,
  ) {
    const post = await this.PostModel.findById(postId);
    const { login } = await this.usersQueryRepository.getUserById(userId);
    post.updateLikeStatus(userId, login, likeStatus);
    await this.postRepository.save(post);
  }
}
