export interface Department {
  id: string;
  name: string;
  description: string;
}

export type CreateDepartmentPayload = {
  name: string;
  description: string;
};

/** `department/update` — `id` body-də */
export type UpdateDepartmentPayload = {
  id: string;
  name: string;
  description: string;
};

export type CreatePositionPayload = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
};

/** `position/update` — `id` body-də */
export type UpdatePositionPayload = CreatePositionPayload;

export interface Position {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}
