import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginatorView } from '../common/view-models/paginatorView';
import { pagesCount } from '../common/helpers/helpers';
import { Post, PostDocument } from './domain/post.schema';
import { PostViewModel } from './view-models/postViewModel';
import { PaginatorInputType } from '../common/inputModels/paginatorInputType';
import { LikeStatusType } from '../common/inputModels/likeInputModel';

@Injectable()
export class PostsQueryRepository {
  constructor(@InjectModel(Post.name) private PostModel: Model<PostDocument>) {}

  async checkPostId(postId: string): Promise<boolean> {
    return !!(await this.PostModel.findById(postId));
  }

  async findPosts(
    paginatorParams: PaginatorInputType,
    blogId?: string,
    userId?: string,
  ): Promise<PaginatorView<PostViewModel>> {
    const { sortBy, sortDirection, pageSize, pageNumber } = paginatorParams;
    const filter = blogId ? { blogId } : {};
    console.log(`filer: ${filter}`);
    console.log(filter);
    const totalCount = await this.PostModel.countDocuments(filter);
    const result = await this.PostModel.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);
    const items: PostViewModel[] = result.map((p) =>
      this.getPostViewModel(p, userId),
    );
    return {
      pagesCount: pagesCount(totalCount, pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  async getPostById(
    postId: string,
    userId?: string,
  ): Promise<PostViewModel | null> {
    const postInDb = await this.PostModel.findById(postId);
    if (!postInDb) return null;
    return this.getPostViewModel(postInDb, userId);
  }

  getPostViewModel(post: Post, userId?: string): PostViewModel {
    console.log('getPostViewModel');
    console.log(`userId:${userId}`);
    const likes = post.likes.filter(
      (l) => l.likeStatus === 'Like' && !l.userBan,
    );
    const likesCount = likes.length;
    const dislike = post.likes.filter(
      (l) => l.likeStatus === 'Dislike' && !l.userBan,
    );
    const dislikesCount = dislike.length;
    likes.sort((l1, l2) => {
      if (l1.addedAt < l2.addedAt) return 1;
      if (l1.addedAt > l2.addedAt) return -1;
      return 0;
    });
    console.log(likes);
    const lastLikes = likes.slice(0, 3);
    const newestLikes = lastLikes.map((l) => ({
      addedAt: l.addedAt.toISOString(),
      userId: l.userId,
      login: l.login,
    }));
    let myStatus: LikeStatusType = 'None';
    if (userId) {
      const myLike = post.likes.find((l) => l.userId === userId);
      if (myLike) myStatus = myLike.likeStatus;
    }
    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount,
        dislikesCount,
        myStatus,
        newestLikes,
      },
    };
  }
}
