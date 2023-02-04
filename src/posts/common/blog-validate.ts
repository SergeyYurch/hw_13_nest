import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { QueryRepository } from '../../query/query.repository';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'blogId', async: true })
@Injectable()
export class IsBlogExistConstraint implements ValidatorConstraintInterface {
  constructor(protected readonly queryRepository: QueryRepository) {}
  async validate(blogId: string) {
    return await this.queryRepository.checkBlogId(blogId);
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
