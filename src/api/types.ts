import { AxiosError, AxiosResponse } from "axios";

declare global {
  export type TPaginationType = {
    presentPage: number;
    total: number;
    limit: number;
    previousPage: number | null;
    nextPage: number | null;
    totalPage: number;
  };
  export type TMetaType = {
    nextLink: string | null;
    previousLink: string | null;
    presentLink: string | null;
  };

  export type TResultPaginationType = {
    meta: TMetaType;
    pagination: TPaginationType;
  };


  export type TApiCallResponseType<T> = { data: T } & TResultPaginationType;

  export type TErrorResponseType = {
    message?: string;
    errors?: {
      [name: string]: string | string[];
    };
  };

  export type TApiRequestResponseType<T> = Promise<
    AxiosResponse<TApiCallResponseType<T>>
  >;

  export type TApiErrorResponseType = AxiosError<TErrorResponseType>;
}

export {};
