import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface UserProfile {
  age?: number
  gender?: "male" | "female" | "other"
  height?: number
  weight?: number
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active"
  goals?: string[]
}

interface UserState {
  profile: UserProfile | null
  preferences: {
    units: "metric" | "imperial"
    notifications: boolean
    theme: "light" | "dark" | "system"
  }
  isLoading: boolean
  error: string | null
}

const initialState: UserState = {
  profile: null,
  preferences: {
    units: "metric",
    notifications: true,
    theme: "system",
  },
  isLoading: false,
  error: null,
}

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      state.profile = { ...state.profile, ...action.payload }
    },
    updatePreferences: (state, action: PayloadAction<Partial<UserState["preferences"]>>) => {
      state.preferences = { ...state.preferences, ...action.payload }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { updateProfile, updatePreferences, setLoading, setError } = userSlice.actions
