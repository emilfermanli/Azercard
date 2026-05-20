// Generouted, changes to this file will be overriden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client';

export type Path =
  | `///`
  | `/403`
  | `/azmap`
  | `/departamentler`
  | `/forecasting`
  | `/istifadeciler`
  | `/login`
  | `/marketbenchmark`
  | `/pozisiyalar`
  | `/rollar`
  | `/sectorspend`
  | `/worldmap`;

export type Params = {};

export type ModalPath = `/modals/example`;

export const { Link, Navigate } = components<Path, Params>();
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>();
export const { redirect } = utils<Path, Params>();
