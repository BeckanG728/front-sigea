export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  idUsuario: number;
  nombreUsuario: string;
  idRol: number;
  nombreRol: string;
  login2fa: boolean;
}

export interface Verify2FARequest {
  idUsuario: number;
  codigoTotp: string;
}

export interface Verify2FAResponse {
  token: string;
  expiresIn: number;
  idUsuario: number;
}

export interface ChangePasswordRequest {
  passwordActual: string;
  passwordNueva: string;
}

export interface Enable2FARequest {
  password: string;
}

export interface Enable2FAResponse {
  secretoQr: string;
  dosFactorHabilitado: boolean;
}

export interface ErrorResponse {
  error: string;
  message: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}
