import { BlogViewModel } from './blog.view.model';

export class BlogWithOwnerViewModel extends BlogViewModel {
  blogOwnerInfo: {
    userId: string;
    userLogin: string;
  };
}
