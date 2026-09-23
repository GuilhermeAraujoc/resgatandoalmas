import { request } from "./api";
import type { UserDto } from "./dto";

export interface RegisterInput {
  name: string;
  cpf: string;
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
  request<{ user: UserDto }>("POST", "/auth/register", input);

export const login = (input: LoginInput) =>
  request<{ user: UserDto }>("POST", "/auth/login", input);

export const logout = () => request<void>("POST", "/auth/logout");
