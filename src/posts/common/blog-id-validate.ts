import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { BlogsQueryRepository } from '../../blogs/providers/blogs.query.repository';

@ValidatorConstraint({ name: 'blogId', async: true })
@Injectable()
export class IsBlogExistConstraint implements ValidatorConstraintInterface {
  constructor(protected readonly blogsQueryRepository: BlogsQueryRepository) {}
  async validate(blogId: string) {
    return await this.blogsQueryRepository.checkBlogId(blogId);
  }
}

export function IsBlogExist(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsBlogExistConstraint,
    });
  };
}
