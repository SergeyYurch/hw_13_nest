import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from '../domain/blog.schema';
import { pagesCount } from '../../common/helpers/helpers';
import { BlogViewModel } from '../dto/view-models/blog.view.model';
import { PaginatorViewModel } from '../../common/dto/view-models/paginator.view.model';
import { BlogWithOwnerViewModel } from '../dto/view-models/blog-with-owner.view.model';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: Model<BlogDocument>) {}

  async checkBlogId(blogId: string): Promise<boolean> {
    return !!(await this.BlogModel.findById(blogId));
  }

  async findBlogs(
    paginatorParams,
    searchNameTerm,
    options?: { ownerInclude?: boolean; userId?: string },
  ): Promise<PaginatorViewModel<BlogViewModel>> {
    const { sortBy, sortDirection, pageSize, pageNumber } = paginatorParams;
    let filter = searchNameTerm
      ? { name: { $regex: searchNameTerm, $options: 'i' } }
      : {};
    if (options?.userId) {
      filter = { ...filter, ...{ 'blogOwnerInfo.userId': options.userId } };
    }
    const totalCount = await this.BlogModel.countDocuments(filter);
    const result = await this.BlogModel.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);
    const items: BlogViewModel[] = options?.ownerInclude
      ? result.map((b) => this.getBlogViewModelWithOwner(b))
      : result.map((b) => this.getBlogViewModel(b));
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

  getBlogViewModelWithOwner(
    blog: Blog,
  ): BlogWithOwnerViewModel | BlogViewModel {
    const blogView = this.getBlogViewModel(blog);
    if (blog.blogOwnerInfo)
      return { ...blogView, blogOwnerInfo: blog.blogOwnerInfo };
    return blogView;
  }

  async getBlogOwner(blogId: string) {
    const blog = await this.BlogModel.findById(blogId);
    return blog.blogOwnerInfo
      ? {
          userId: blog.blogOwnerInfo.userId,
          userLogin: blog.blogOwnerInfo.userLogin,
        }
      : null;
  }
}
