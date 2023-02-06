import { LikeStatusType } from '../inputModels/likeInputModel';

export interface LikesInfoViewModel {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatusType;
}
