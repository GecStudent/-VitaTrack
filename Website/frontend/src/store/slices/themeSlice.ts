import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface ThemeState {
  mode: "light" | "dark" | "system"
  primaryColor: string
  fontSize: "small" | "medium" | "large"
}

const initialState: ThemeState = {
  mode: "system",
  primaryColor: "#10b981",
  fontSize: "medium",
}

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeState["mode"]>) => {
      state.mode = action.payload
    },
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primaryColor = action.payload
    },
    setFontSize: (state, action: PayloadAction<ThemeState["fontSize"]>) => {
      state.fontSize = action.payload
    },
  },
})

export const { setThemeMode, setPrimaryColor, setFontSize } = themeSlice.actions
