export interface CurrentUserApiResponse {
  id: string;
  userName: string;
  email: string;
  roleName: string[];
}

/** Auth/GetAllUsers sətri */
export interface UserListItemApi {
  id: string;
  userName: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  email: string;
  roleName: string[];
}

export interface GetAllUsersApiResponse {
  items: UserListItemApi[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type GetAllUsersParams = {
  pageNumber: number;
  pageSize: number;
  role?: string;
  departmentId?: string;
  positionId?: string;
  /** Auth/GetAllUsers — backend axtarış query paramı (ad/e-poçt) */
  search?: string;
};

export type AssignRolePayload = {
  userId: string;
  roleName: string;
};

export type RefreshTokenPayload = {
  refreshToken: string;
};

export type ResetPasswordPayload = {
  email: string;
  token: string;
  newPassword: string;
};

export type SendResetOtpPayload = {
  email: string;
};

export type RegisterUserPayload = {
  email: string;
  password: string;
  phone: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  positionId: string;
};

export type EditUserPayload = {
  userId: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  departmentId: string | null;
  positionId: string | null;
};

/** Cədvəl üçün sadələşdirilmiş sətir */
export interface UserListRow {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  departmentId: string;
  positionId: string;
  email: string;
  /** Trim edilmiş, boş olmayan rol adları (sıra API-dakı kimi) */
  roleNames: string[];
}

export interface GetAllUsersResult {
  rows: UserListRow[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface User {
  id: string | number;
  username: string;
  name: string;
  surname: string;
  email: string;
  contactNumber: string;
  role: {
    id: number;
    name: string;
    key: string;
  };
  image: string;
}
