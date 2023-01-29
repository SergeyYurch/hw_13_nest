import { PaginatorInputType } from '../../api/inputModels/paginatorInputType';

import { v4 as uuidv4 } from 'uuid';

export const castQueryParams = (query): PaginatorInputType => {
  const queryParams = new PaginatorInputType();
  queryParams.pageNumber = query.pageNumber ? +query.pageNumber : 1;
  queryParams.pageSize = query.pageSize ? +query.pageSize : 10;
  queryParams.sortBy = query.sortBy ?? 'createdAt';
  queryParams.sortDirection = query.sortDirection ?? 'desc';
  return queryParams;
};

export const pagesCount = (totalCount: number, pageSize: number) =>
  Math.ceil(totalCount / pageSize);
//
// export const generatePassHash = async (
//   password: string,
//   salt: string,
// ): Promise<string> => {
//   return await hash(password, salt);
// };
//
// export const generateHashSalt = async (): Promise<string> => {
//   const salt_base = Number(process.env.HASH_SALT_BASE) || 10;
//   return await bcrypt.genSalt(salt_base);
// };

export const getConfirmationCode = (): string => uuidv4();

export const getConfirmationEmailExpirationDate = () =>
  new Date(+process.env.CONFIRM_EMAIL_LIFE_PERIOD_SEC * 1000 + Date.now());

export const getPasswordRecoveryCodeExpirationDate = () =>
  new Date(
    +process.env.PASSWORD_RECOVERY_CODE_LIFE_PERIOD_SEC * 1000 + Date.now(),
  );
