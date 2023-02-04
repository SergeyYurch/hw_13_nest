import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from '../blogs/domain/blog.schema';
import { PaginatorView } from './viewModels/paginatorView';
import { BlogViewModel } from './viewModels/blogViewModel';
import { pagesCount } from '../infrastructure/helpers/helpers';
import { Post, PostDocument } from '../posts/domain/post.schema';
import { PostViewModel } from './viewModels/postViewModel';
import { PaginatorInputType } from '../api/inputModels/paginatorInputType';
import { User, UserDocument } from '../users/domain/user.schema';
import { UserViewModel } from './viewModels/userViewModel';
import { LikeStatusType } from '../api/inputModels/likeInputModel';
import { Comment, CommentDocument } from '../comments/domain/comment.schema';
import { CommentViewModel } from './viewModels/commentViewModel';
import { MeViewModel } from './viewModels/meViewModel';

@Injectable()
export class QueryRepository {
  constructor(
    @InjectModel(Blog.name) private BlogModel: Model<BlogDocument>,
    @InjectModel(Post.name) private PostModel: Model<PostDocument>,
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    @InjectModel(Comment.name) private CommentModel: Model<CommentDocument>,
  ) {}

  async checkUserId(userId: string): Promise<boolean> {
    return !!(await this.UserModel.findById(userId));
  }

  async checkBlogId(blogId: string): Promise<boolean> {
    return !!(await this.BlogModel.findById(blogId));
  }

  async checkPostId(postId: string): Promise<boolean> {
    return !!(await this.PostModel.findById(postId));
  }

  async checkCommentId(commentId: string) {
    return !!(await this.CommentModel.findById(commentId));
  }
  async findUserByLoginOrEmail(loginOrEmail: string) {
    return await this.UserModel.findOne({
      $or: [
        { 'accountData.email': loginOrEmail },
        { 'accountData.login': loginOrEmail },
      ],
    }).exec();
  }

  async findBlogs(
    paginatorParams,
    searchNameTerm,
  ): Promise<PaginatorView<BlogViewModel>> {
    const { sortBy, sortDirection, pageSize, pageNumber } = paginatorParams;
    const filter = searchNameTerm
      ? { name: { $regex: searchNameTerm, $options: 'i' } }
      : {};
    const totalCount = await this.BlogModel.countDocuments(filter);
    const result = await this.BlogModel.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);
    const items: BlogViewModel[] = result.map((b) => this.getBlogViewModel(b));
    return {
      pagesCount: pagesCount(totalCount, pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  async getBlogById(id: string): Promise<BlogViewModel | null> {
    const blog = await this.BlogModel.findById(id);
    if (!blog) return null;
    return this.getBlogViewModel(blog);
  }

  async getUserById(id: string): Promise<UserViewModel | null> {
    const user = await this.UserModel.findById(id);
    if (!user) return null;
    return this.getUserViewModel(user);
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

  async findUsers(
    paginatorParams: PaginatorInputType,
    searchLoginTerm: string,
    searchEmailTerm: string,
  ) {
    const { sortBy, sortDirection, pageSize, pageNumber } = paginatorParams;
    const searchQuery = [];
    let filter = {};
    if (searchLoginTerm)
      searchQuery.push({
        'accountData.login': new RegExp(searchLoginTerm, 'i'),
      });
    if (searchEmailTerm)
      searchQuery.push({
        'accountData.email': new RegExp(searchEmailTerm, 'i'),
      });
    if (searchQuery.length > 0) filter = { $or: searchQuery };
    const totalCount = await this.UserModel.countDocuments(filter);
    const result = await this.UserModel.find(filter)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [`accountData.${sortBy}`]: sortDirection });
    const items: UserViewModel[] = result.map((u) => this.getUserViewModel(u));
    return {
      pagesCount: pagesCount(totalCount, pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  async getCommentsById(commentId: string, userId?: string) {
    const comment = await this.CommentModel.findById(commentId);
    if (!comment) return null;
    return this.getCommentViewModel(comment, userId);
  }

  async getCommentsByPostId(
    paginatorParams: PaginatorInputType,
    postId: string,
    userId?: string,
  ) {
    const { sortBy, sortDirection, pageSize, pageNumber } = paginatorParams;
    const totalCount = await this.CommentModel.countDocuments({ postId });
    const comments = await this.CommentModel.find({ postId })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection });
    const items: CommentViewModel[] = comments.map((c) =>
      this.getCommentViewModel(c, userId),
    );

    return {
      pagesCount: pagesCount(totalCount, pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  getMeViewModel(user: User): MeViewModel {
    return {
      login: user.accountData.login,
      email: user.accountData.email,
      userId: user._id.toString(),
    };
  }

  getUserViewModel(user: User): UserViewModel {
    return {
      id: user._id.toString(),
      email: user.accountData.email,
      login: user.accountData.login,
      createdAt: user.accountData.createdAt.toISOString(),
    };
  }

  getBlogViewModel(blog: Blog): BlogViewModel {
    return {
      id: blog._id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt.toISOString(),
      isMembership: blog.isMembership,
    };
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
      console.log('getPostViewModel');
      console.log(`userId:${userId}`);
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

  getCommentViewModel(
    comment: CommentDocument,
    userId?: string,
  ): CommentViewModel {
    let likesCount = 0;
    let dislikesCount = 0;
    let myStatus: LikeStatusType = 'None';
    if (comment.likes.length > 0) {
      likesCount = comment.likes.filter((c) => c.likeStatus === 'Like').length;
      dislikesCount = comment.likes.filter(
        (c) => c.likeStatus === 'Dislike',
      ).length;
      myStatus = userId
        ? comment.likes.find((l) => l.userId === userId).likeStatus
        : 'None';
    }

    return {
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt.toISOString(),
      likesInfo: {
        likesCount,
        dislikesCount,
        myStatus,
      },
    };
  }

  async getMeInfo(userId: string) {
    const user = await this.UserModel.findById(userId);
    if (!user) return null;
    return this.getMeViewModel(user);
  }
}
