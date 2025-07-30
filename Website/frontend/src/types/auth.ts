export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
  updatedAt: string
  profile?: UserProfile
}

export interface UserProfile {
  age?: number
  gender?: "male" | "female" | "other"
  height?: number // in cm
  weight?: number // in kg
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active"
  goals?: string[]
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}
