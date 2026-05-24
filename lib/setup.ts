import { validateWorkerPassword } from "./user-management";

export function canUseFirstRunSetup(userCount: number) {
  return userCount === 0;
}

export function validateFirstRunSetupPassword(password: string, confirmPassword: string) {
  const passwordResult = validateWorkerPassword(password);

  if (!passwordResult.valid) {
    return passwordResult;
  }

  if (password !== confirmPassword) {
    return { valid: false, message: "Passwords do not match." };
  }

  return { valid: true, message: null };
}

export function normalizeSetupAccountCode(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeSetupUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidSetupAccountCode(value: string) {
  return /^[a-z0-9-]{2,40}$/.test(value);
}

export function isValidSetupUsername(value: string) {
  return /^[a-z0-9._-]{3,40}$/.test(value);
}
