import { IsString, Length } from 'class-validator';

export class BlogPostInputModel {
  @IsString()
  @Length(1, 20)
  title: string; // *, maxLength: 30

  @IsString()
  @Length(1, 100)
  shortDescription: string; // * , maxLength: 100

  @IsString()
  @Length(1, 1000)
  content: string; // *,  maxLength: 1000
}
