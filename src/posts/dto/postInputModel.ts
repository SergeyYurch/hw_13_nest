import { IsString, Length } from 'class-validator';

export class PostInputModel {
  @IsString()
  @Length(1, 30)
  title: string; // *, maxLength: 30

  @IsString()
  @Length(1, 100)
  shortDescription: string; // * , maxLength: 100

  @IsString()
  @Length(1, 1000)
  content: string; // *,  maxLength: 1000

  @IsString()
  blogId: string; // *
}
