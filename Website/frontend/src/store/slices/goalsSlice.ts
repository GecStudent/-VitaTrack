import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface Goal {
  id: string
  title: string
  description: string
  type: "weight" | "nutrition" | "exercise" | "habit"
  target: number
  current: number
  unit: string
  deadline: string
  isCompleted: boolean
  createdAt: string
}

interface GoalsState {
  goals: Goal[]
  isLoading: boolean
  error: string | null
}

const initialState: GoalsState = {
  goals: [],
  isLoading: false,
  error: null,
}

export const goalsSlice = createSlice({
  name: "goals",
  initialState,
  reducers: {
    addGoal: (state, action: PayloadAction<Goal>) => {
      state.goals.push(action.payload)
    },
    updateGoal: (state, action: PayloadAction<Partial<Goal> & { id: string }>) => {
      const index = state.goals.findIndex((goal) => goal.id === action.payload.id)
      if (index !== -1) {
        state.goals[index] = { ...state.goals[index], ...action.payload }
      }
    },
    removeGoal: (state, action: PayloadAction<string>) => {
      state.goals = state.goals.filter((goal) => goal.id !== action.payload)
    },
    updateProgress: (state, action: PayloadAction<{ id: string; current: number }>) => {
      const goal = state.goals.find((goal) => goal.id === action.payload.id)
      if (goal) {
        goal.current = action.payload.current
        goal.isCompleted = goal.current >= goal.target
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

export const { addGoal, updateGoal, removeGoal, updateProgress, setLoading, setError } = goalsSlice.actions
