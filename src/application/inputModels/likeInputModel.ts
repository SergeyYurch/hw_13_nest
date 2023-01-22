export type LikeStatusType = 'None' | 'Like' | 'Dislike';

export const LikeStatus: { [like: string]: LikeStatusType } = {
  none: 'None',
  like: 'Like',
  dislike: 'Dislike',
};

export interface LikeInputModel {
  likeStatus: LikeStatusType;
}
