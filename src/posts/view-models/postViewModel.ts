import { ExtendedLikesInfoViewModel } from '../../common/view-models/extendedLikesInfoViewModel';

export interface PostViewModel {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfoViewModel;
}
