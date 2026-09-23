import { request } from "./api";
import type { ProgressDto, UserDto } from "./dto";

export interface ProfileUpdate {
  name: string;
  email: string;
  /** Empty keeps the stored CPF. */
  cpf: string;
  phone: string;
  /** "YYYY-MM-DD" or empty. */
  birthDate: string;
}

export const getMe = () => request<{ user: UserDto }>("GET", "/me");

export const updateMe = (input: ProfileUpdate) =>
  request<{ user: UserDto }>("PATCH", "/me", input);

export const deleteMe = () => request<void>("DELETE", "/me");

export const getProgress = () => request<ProgressDto>("GET", "/me/progress");
