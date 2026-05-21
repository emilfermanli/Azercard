import type { MiddlewareAPI, Middleware } from '@reduxjs/toolkit';

import { isRejectedWithValue } from '@reduxjs/toolkit';
import { toast } from '@/hooks/useToast';
import { parseApiErrorMessage, parseApiErrorStatusCode } from '@/utils/api-error';

import { logout } from '@/store/features/auth.slice';

type RejectedPayload = {
  status?: number;
  data?: unknown;
};

const locallyHandledErrorEndpoints = new Set(['createRole', 'registerUser', 'editUser']);

export const ErrorMiddleware: Middleware =
  (api: MiddlewareAPI) => (next) => (action: any) => {
    if (isRejectedWithValue(action)) {
      const payload = action.payload as RejectedPayload;
      const data = payload?.data;
      const errorMsg = action.error?.message as string | undefined;
      const endpointName = action.meta?.arg?.endpointName as string | undefined;

      const apiMessage = parseApiErrorMessage(data);
      const description =
        apiMessage ||
        (errorMsg && errorMsg !== 'Rejected'
          ? errorMsg
          : `${payload?.status ?? 'Xəta'}: Xəta baş verdi${
              import.meta.env.DEV && action.meta?.arg?.endpointName
                ? ` [${action.meta.arg.endpointName}()]`
                : ''
            }`);

      if (!endpointName || !locallyHandledErrorEndpoints.has(endpointName)) {
        toast({ description, variant: 'destructive' });
      }

      const status = parseApiErrorStatusCode(data, payload?.status);
      const isLoginMutation = endpointName === 'login';

      if (status === 401 && !isLoginMutation) {
        api.dispatch(logout());
        window.location.replace('/login');
      }
    }

    return next(action);
  };
