import { userRepository } from "../repositories/user.repository.js";
import { conflict, notFound, forbidden } from "../lib/errors.js";
import { formatDateOnly, parseDateOnly } from "../lib/dates.js";
import type { Prisma, User } from "../generated/db/client.js";
import type { UpdateProfileInput } from "../validation/user.schemas.js";

export function toUserDto(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: user.cpf ?? "",
    role: user.role,
    phone: user.phone,
    birthDate: user.birthDate ? formatDateOnly(user.birthDate) : null,
    createdAt: user.createdAt.toISOString(),
  };
}

export type UserDto = ReturnType<typeof toUserDto>;

export const userService = {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw notFound("Usuário não encontrado.");
    return toUserDto(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const taken = await userRepository.findConflicts(
      {
        ...(input.email ? { email: input.email } : {}),
        ...(input.cpf ? { cpf: input.cpf } : {}),
      },
      userId,
    );
    if (taken.some((user) => user.email === input.email))
      throw conflict("Este e-mail já está em uso por outra conta.");
    if (taken.length > 0)
      throw conflict("Este CPF já está em uso por outra conta.");

    const data: Prisma.UserUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.email !== undefined) data.email = input.email;
    if (input.cpf !== undefined) data.cpf = input.cpf;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.birthDate !== undefined)
      data.birthDate = input.birthDate && parseDateOnly(input.birthDate);

    return toUserDto(await userRepository.update(userId, data));
  },

  async deleteAccount(userId: string) {
    const user = await userRepository.findById(userId);
    if (user?.role === "ADMIN") throw forbidden("Contas administrativas são gerenciadas pelo operador do sistema.");
    await userRepository.delete(userId);
  },
};
