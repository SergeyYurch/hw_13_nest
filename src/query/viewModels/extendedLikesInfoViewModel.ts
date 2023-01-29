import { LikesInfoViewModel } from './likesInfoViewModel';
import { LikeDetailsViewModel } from './ likeDetailsViewModel';

export interface ExtendedLikesInfoViewModel extends LikesInfoViewModel {
  newestLikes: LikeDetailsViewModel[];
}
