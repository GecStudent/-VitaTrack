import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  serving: string
}

interface MealEntry {
  id: string
  foodItem: FoodItem
  quantity: number
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
  date: string
}

interface FoodState {
  entries: MealEntry[]
  recentFoods: FoodItem[]
  favorites: FoodItem[]
  dailyGoals: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  isLoading: boolean
  error: string | null
}

const initialState: FoodState = {
  entries: [],
  recentFoods: [],
  favorites: [],
  dailyGoals: {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
  },
  isLoading: false,
  error: null,
}

export const foodSlice = createSlice({
  name: "food",
  initialState,
  reducers: {
    addFoodEntry: (state, action: PayloadAction<MealEntry>) => {
      state.entries.push(action.payload)
    },
    removeFoodEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter((entry) => entry.id !== action.payload)
    },
    updateDailyGoals: (state, action: PayloadAction<Partial<FoodState["dailyGoals"]>>) => {
      state.dailyGoals = { ...state.dailyGoals, ...action.payload }
    },
    addToFavorites: (state, action: PayloadAction<FoodItem>) => {
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

export const { addFoodEntry, removeFoodEntry, updateDailyGoals, addToFavorites, setLoading, setError } =
  foodSlice.actions
