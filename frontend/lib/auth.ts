import { apiConfig } from './api';

export interface AuthUser {
  id: string;
  email: string | null;
  mobile: string | null;
  avatar: string | null;
  provider: string | null;
}

export interface AuthResponse {
  status: string;
  user: AuthUser | null;
  mode?: string;
  message?: string;
  reference_no?: string;
  referenceNo?: string;
  remaining_attempts?: number;
  remainingAttempts?: number;
  response?: string;
}

const handleResponse = async (response: Response) => {
  const text = await response.text();
  const contentType = response.headers.get('content-type') ?? '';
  const data =
    contentType.includes('application/json') && text
      ? JSON.parse(text)
      : text;

  if (!response.ok) {
    const message =
      typeof data === 'string'
        ? data
        : data?.message ?? 'Authentication failed.';
    throw new Error(message);
  }

  return data as AuthResponse;
};

const request = (
  endpoint: string,
  init: RequestInit = {}
): Promise<AuthResponse> => {
  const url = `${apiConfig.baseUrl}${endpoint}`;
  const method = init.method ?? 'POST';
  return fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    ...init,
  }).then(handleResponse);
};

export const fetchCurrentUser = (): Promise<AuthResponse> =>
  fetch(`${apiConfig.baseUrl}/auth/me`, {
    credentials: 'include',
  }).then(handleResponse);

export const requestLoginOtp = (mobile: string, password: string) =>
  request('/auth/request-otp', {
    body: JSON.stringify({ mobile, password }),
  });

export const verifyLoginOtp = (
  mobile: string,
  password: string,
  referenceNo: string,
  otp: string
) =>
  request('/auth/verify-otp', {
    body: JSON.stringify({ mobile, password, reference_no: referenceNo, otp }),
  });

export const registerWithEmail = (email: string, password: string) =>
  request('/auth/register-email', {
    body: JSON.stringify({ email, password }),
  });

export const logout = () =>
  request('/auth/logout', {
    method: 'POST',
  });
