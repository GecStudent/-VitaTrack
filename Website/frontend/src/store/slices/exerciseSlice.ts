import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface Exercise {
  id: string
  name: string
  category: string
  caloriesPerMinute: number
}

interface ExerciseEntry {
  id: string
  exercise: Exercise
  duration: number
  calories: number
  date: string
  notes?: string
}

interface ExerciseState {
  entries: ExerciseEntry[]
  recentExercises: Exercise[]
  favorites: Exercise[]
  weeklyGoal: number // minutes
  isLoading: boolean
  error: string | null
}

const initialState: ExerciseState = {
  entries: [],
  recentExercises: [],
  favorites: [],
  weeklyGoal: 150, // 150 minutes per week
  isLoading: false,
  error: null,
}

export const exerciseSlice = createSlice({
  name: "exercise",
  initialState,
  reducers: {
    addExerciseEntry: (state, action: PayloadAction<ExerciseEntry>) => {
      state.entries.push(action.payload)
    },
    removeExerciseEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter((entry) => entry.id !== action.payload)
    },
    updateWeeklyGoal: (state, action: PayloadAction<number>) => {
      state.weeklyGoal = action.payload
    },
    addToFavorites: (state, action: PayloadAction<Exercise>) => {
      if (!state.favorites.find((item) => item.id === action.payload.id)) {
        state.favorites.push(action.payload)
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { addExerciseEntry, removeExerciseEntry, updateWeeklyGoal, addToFavorites, setLoading, setError } =
  exerciseSlice.actions
