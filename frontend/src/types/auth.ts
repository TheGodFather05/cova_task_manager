/** Mirrors AuthResponse. The refresh token is httpOnly and never reaches JavaScript. */
export interface AuthResponse {
  token: string
  email: string
}

export interface Credentials {
  email: string
  password: string
}
