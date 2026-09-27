import { request } from "./api";
import type { UserDto } from "./dto";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
  remember: boolean;
}

export const register = (input: RegisterInput) =>
  request<{ message: string; emailSent: boolean }>("POST", "/auth/register", input);

export const login = (input: LoginInput) =>
  request<{ user: UserDto }>("POST", "/auth/login", input);

export const logout = () => request<void>("POST", "/auth/logout");

export const verifyEmail = (token: string) =>
  request<{ message: string }>("GET", `/auth/verificar-email?token=${encodeURIComponent(token)}`);

export const resendConfirmation = (email: string) =>
  request<{ message: string }>("POST", "/auth/reenviar-confirmacao", { email });
