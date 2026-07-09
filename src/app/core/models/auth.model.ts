export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  token: string | null;
  tokenType?: string;
  expiresIn?: number;
  idUsuario: number;
  rol: string;
  requiere2FA: boolean;
  funcionalidades?: import('./funcionalidad.model').FuncionalidadNode[];
}

export interface Verify2FARequest {
  idUsuario: number;
  codigoTotp: string;
}

export interface Verify2FAResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  idUsuario: number;
  rol: string;
  funcionalidades?: import('./funcionalidad.model').FuncionalidadNode[];
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
