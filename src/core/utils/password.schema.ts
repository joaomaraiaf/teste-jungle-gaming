import { z } from 'zod';

export const passwordSchema = z
  .string()
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/,
    'A senha deve conter de 8 a 20 caracteres, incluindo letras maiúsculas e minúsculas, um número e um símbolo.'
  );
