type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error) {
    const message = (error as ApiError).response?.data?.message;
    if (message) return message;
  }
  return fallback;
}
