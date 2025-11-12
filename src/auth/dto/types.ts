export interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface SignUpRequest {
  email: string;
  name: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}
