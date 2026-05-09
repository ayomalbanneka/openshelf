import { error } from 'console';
import { gooeyToast } from 'goey-toast';
import { success } from 'zod';

export const toast = {
    success: (message: string) =>
        gooeyToast.success(message),

    error: (message: string) =>
        gooeyToast.error(message),

    warning: (message: string) =>
        gooeyToast.warning(message),

    info: (message: string) =>
        gooeyToast.info(message),

    promise: <T>(
        promise: Promise<T>,
        message: { loading: string, success: string, error: string }
    ) =>
        gooeyToast.promise(promise, {
            loading: message.loading,
            success: message.success,
            error: message.error,
        }),
}