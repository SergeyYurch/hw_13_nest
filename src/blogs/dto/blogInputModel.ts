import { IsString, Length, Matches } from 'class-validator';

export class BlogInputModel {
  @IsString()
  @Length(1, 20)
  name: string; //*, maxLength: 15

  @IsString()
  @Length(1, 500)
  description: string; //*, maxLength: 500

  @IsString()
  @Length(1, 100)
  @Matches(/^https:\/\/([a-zA-Z0-9_-]+.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/)
  websiteUrl: string; //  *,  maxLength: 100, pattern: ^https://([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$
}
