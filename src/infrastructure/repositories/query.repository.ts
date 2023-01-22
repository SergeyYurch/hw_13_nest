import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from '../../domain/schemas/blog.schema';
import { PaginatorView } from '../viewModels/paginatorView';
import { BlogViewModel } from '../viewModels/blogViewModel';
import { pagesCount } from '../helpers/helpers';
import { Post, PostDocument } from '../../domain/schemas/post.schema';
import { PostViewModel } from '../viewModels/postViewModel';
import { PaginatorInputType } from '../../application/inputModels/paginatorInputType';
import { User, UserDocument } from '../../domain/schemas/user.schema';
import { UserViewModel } from '../viewModels/userViewModel';

@Injectable()
export class QueryRepository {
  constructor(
    @InjectModel(Blog.name) private BlogModel: Model<BlogDocument>,
    @InjectModel(Post.name) private PostModel: Model<PostDocument>,
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
  ) {}

  async checkUserId(userId: string): Promise<boolean> {
    return !!(await this.UserModel.findById(userId));
  }

  async checkBlogId(blogId: string): Promise<boolean> {
    return !!(await this.BlogModel.findById(blogId));
  }

  async checkPostId(postId: string): Promise<boolean> {
    console.log(`check post id ${postId}`);
    return !!(await this.PostModel.findById(postId));
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
    const items: BlogViewModel[] = result.map((b) => b.getViewModel());
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
    return blog.getViewModel();
  }

  async findPosts(
    paginatorParams: PaginatorInputType,
    blogId?: string,
  ): Promise<PaginatorView<PostViewModel>> {
    const { sortBy, sortDirection, pageSize, pageNumber } = paginatorParams;
    const filter = blogId ? { blogId } : {};
    const totalCount = await this.PostModel.countDocuments(filter);
    const result = await this.PostModel.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);
    const items: PostViewModel[] = result.map((b) => b.getViewModel());
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
    return postInDb.getViewModel();
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
    const items: UserViewModel[] = result.map((b) => b.getViewModel());
    return {
      pagesCount: pagesCount(totalCount, pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }
}
