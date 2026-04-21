import { User } from './user.type';

export interface AuthLoginPayload {
  email: string;
  password: string;
}

/** POST Auth/login birbaşa cavab */
export interface AuthLoginApiResponse {
  accessToken: string;
  refreshToken: string;
  expireAt: string;
}

export interface Auth {
  user: User;
  accessToken: string;
  accessTokenExpireDate: Date;
  refreshToken: string;
  refreshTokenExpireDate: Date;
}
