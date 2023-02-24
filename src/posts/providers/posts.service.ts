import { PostViewModel } from '../dto/view-models/post.view.model';
import { PostInputModel } from '../dto/input-models/post.input.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from '../domain/post.schema';
import { Model, Types } from 'mongoose';
import { PostsRepository } from './posts.repository';
import { Blog, BlogDocument } from '../../blogs/domain/blog.schema';
import { LikeStatusType } from '../../common/dto/input-models/like.input.model';
import { PostsQueryRepository } from './posts.query.repository';
import { UsersQueryRepository } from '../../users/providers/users.query.repository';
import { BlogsQueryRepository } from '../../blogs/providers/blogs.query.repository';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private PostModel: Model<PostDocument>,
    @InjectModel(Blog.name) private BlogModel: Model<BlogDocument>,
    private postRepository: PostsRepository,
    private postsQueryRepository: PostsQueryRepository,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {}

  async accessCheck(userId, postId: string) {
    const blogId = (await this.postsQueryRepository.getPostById(postId)).blogId;
    if (await this.blogsQueryRepository.isUserBanned(userId, blogId))
      return 'forbidden';
    return 'allowed';
  }
}
