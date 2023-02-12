import { PostsRepository } from '../posts.repository';
import { PostViewModel } from '../view-models/postViewModel';
import { BlogsQueryRepository } from '../../blogs/blogs.query.repository';
import { CommandHandler } from '@nestjs/cqrs';
import { BlogsService } from '../../blogs/blogs.service';
import { PosCreateDto } from '../dto/posCreateDto';
import { BlogPostInputModel } from '../../blogs/dto/blogPostInputModel';

export class CreateNewPostCommand {
  constructor(
    public userId: string,
    public blogId: string,
    public postInputModel: BlogPostInputModel,
  ) {}
}

@CommandHandler(CreateNewPostCommand)
export class CreateNewPostUseCase {
  constructor(
    private postRepository: PostsRepository,
    private blogQueryRepository: BlogsQueryRepository,
    private blogsService: BlogsService,
  ) {}

  async execute(command: CreateNewPostCommand): Promise<PostViewModel | null> {
    const { userId, blogId, postInputModel } = command;
    const { shortDescription, content, title } = postInputModel;
    await this.blogsService.checkBlogOwner(blogId, userId);
    const createdPost = await this.postRepository.createModel();
    const blog = await this.blogQueryRepository.getBlogById(blogId);
    const postDto: PosCreateDto = {
      title,
      shortDescription,
      content,
      blogId,
      bloggerId: userId,
      blogName: blog.name,
    };
    await createdPost.initial(postDto);
    return await this.postRepository.save(createdPost);
  }
}
