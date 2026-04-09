export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupWithOtpRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  userId: string;
  name: string;
  role: string;
}
