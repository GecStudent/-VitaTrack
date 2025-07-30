// Add shared types and interfaces here
export interface ApiResponse<T> {
  message: string;
  data: T;
} 