export const constructErrorMessage = (
  error: TApiErrorResponseType,
  defaultMessage: string
) => {
  return error?.response?.data?.message ?? defaultMessage;
};
