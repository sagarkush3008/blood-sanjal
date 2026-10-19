export const SuccessResponse = (data: any, requestId: string) => ({
  success: true,
  data,
  meta: { requestId }
});

export const ErrorResponse = (
  code: string,
  message: string,
  details: any[] | undefined,
  requestId: string,
  fields?: Record<string, string>
) => ({
  success: false,
  error: {
    code,
    message,
    details: details || [],
    ...(fields && Object.keys(fields).length > 0 ? { fields } : {})
  },
  meta: { requestId }
});
