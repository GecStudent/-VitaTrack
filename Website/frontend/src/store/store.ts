import { configureStore } from "@reduxjs/toolkit"

import { authSlice } from "./slices/authSlice"
import { userSlice } from "./slices/userSlice"
import { foodSlice } from "./slices/foodSlice"
import { exerciseSlice } from "./slices/exerciseSlice"
import { goalsSlice } from "./slices/goalsSlice"
import { themeSlice } from "./slices/themeSlice"

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    user: userSlice.reducer,
    food: foodSlice.reducer,
    exercise: exerciseSlice.reducer,
    goals: goalsSlice.reducer,
    theme: themeSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
