import { PostsRepository } from '../posts.repository';
import { PostViewModel } from '../../dto/view-models/post.view.model';
import { BlogsQueryRepository } from '../../../blogs/providers/blogs.query.repository';
import { CommandHandler } from '@nestjs/cqrs';
import { BlogsService } from '../../../blogs/providers/blogs.service';
import { PostCreateDto } from '../../dto/post-create.dto';
import { BlogPostInputModel } from '../../../blogs/dto/input-models/blog-post.input.model';

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
    const postDto: PostCreateDto = {
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
