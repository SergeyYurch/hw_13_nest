import { BlogViewModel } from './blogViewModel';

export class BlogViewModelWithOwner extends BlogViewModel {
  blogOwnerInfo: {
    userId: string;
    userLogin: string;
  };
}
