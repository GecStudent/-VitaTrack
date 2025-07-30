# Health & Nutrition Tracking Website - Frontend Architecture Blueprint

## 1. Page Breakdown & Routing Structure

### Public Pages (Unauthenticated)
- **Landing Page** - `/`
- **Login** - `/login`
- **Register** - `/register`
- **Forgot Password** - `/forgot-password`
- **Reset Password** - `/reset-password/:token`
- **Privacy Policy** - `/privacy`
- **Terms of Service** - `/terms`
- **About** - `/about`
- **Pricing** - `/pricing`

### Authenticated Pages (Protected Routes)
- **Dashboard** - `/dashboard`
- **Profile Management** - `/profile`
- **Food & Nutrition**
  - Food Logging - `/food/log`
  - Meal History - `/food/history`
  - Recipe Creator - `/food/recipes`
  - Barcode Scanner - `/food/scanner`
  - Meal Planner - `/food/planner`
- **Exercise & Activity**
  - Exercise Logging - `/exercise/log`
  - Workout History - `/exercise/history`
  - Workout Templates - `/exercise/templates`
  - Activity Tracker - `/exercise/activity`
- **Goals & Progress**
  - Goal Setting - `/goals/set`
  - Progress Tracking - `/goals/progress`
  - Reports & Analytics - `/reports`
- **Community & Social**
  - Community Feed - `/community`
  - Challenges - `/community/challenges`
  - User Profile - `/community/profile/:userId`
- **Settings**
  - Account Settings - `/settings/account`
  - Notification Settings - `/settings/notifications`
  - Privacy Settings - `/settings/privacy`
  - Integration Settings - `/settings/integrations`

### Premium/Paid Features
- **Premium Analytics** - `/premium/analytics`
- **Personal Coaching** - `/premium/coaching`
- **Custom Meal Plans** - `/premium/meal-plans`

## 2. Component Hierarchy (Atomic Design Pattern)

### Atoms (Basic UI Elements)
```
/src/components/atoms/
├── Button/
├── Input/
├── Label/
├── Icon/
├── Badge/
├── Avatar/
├── Spinner/
├── ProgressBar/
├── Toggle/
├── Checkbox/
├── RadioButton/
├── Tooltip/
├── Divider/
└── Typography/
```

### Molecules (Simple Component Groups)
```
/src/components/molecules/
├── FormField/
├── SearchBar/
├── DatePicker/
├── DropdownMenu/
├── ToastNotification/
├── Modal/
├── Tabs/
├── Accordion/
├── Pagination/
├── BreadcrumbNav/
├── StatCard/
├── CalorieCounter/
├── MacronutrientBar/
├── ExerciseCard/
├── FoodItem/
├── MealCard/
├── GoalCard/
└── NotificationBell/
```

### Organisms (Complex Component Groups)
```
/src/components/organisms/
├── Header/
├── Sidebar/
├── Footer/
├── DashboardSummary/
├── FoodLogger/
├── ExerciseTracker/
├── NutritionChart/
├── CalorieChart/
├── ProgressChart/
├── MealPlanCalendar/
├── RecipeBuilder/
├── WorkoutBuilder/
├── GoalTracker/
├── CommunityFeed/
├── UserProfileCard/
├── NotificationCenter/
├── BarcodeScannerWidget/
├── WaterIntakeTracker/
├── SleepTracker/
└── AIRecommendations/
```

### Templates (Page Layouts)
```
/src/components/templates/
├── AuthLayout/
├── DashboardLayout/
├── PublicLayout/
├── SettingsLayout/
├── CommunityLayout/
├── ReportsLayout/
└── PremiumLayout/
```

### Pages (Complete Views)
```
/src/pages/
├── public/
│   ├── LandingPage/
│   ├── LoginPage/
│   ├── RegisterPage/
│   └── PricingPage/
├── dashboard/
│   └── DashboardPage/
├── food/
│   ├── FoodLogPage/
│   ├── MealHistoryPage/
│   ├── RecipeCreatorPage/
│   └── MealPlannerPage/
├── exercise/
│   ├── ExerciseLogPage/
│   ├── WorkoutHistoryPage/
│   └── ActivityTrackerPage/
├── goals/
│   ├── GoalSettingPage/
│   └── ProgressTrackingPage/
├── reports/
│   └── ReportsPage/
├── community/
│   ├── CommunityFeedPage/
│   └── ChallengesPage/
├── settings/
│   ├── AccountSettingsPage/
│   └── NotificationSettingsPage/
└── premium/
    ├── PremiumAnalyticsPage/
    └── CoachingPage/
```

## 3. Template Layouts

### AuthLayout
- **Structure**: Simple centered container
- **Components**: Logo, form container, background imagery
- **Usage**: Login, Register, Forgot Password pages

### PublicLayout
- **Structure**: Header + Main Content + Footer
- **Components**: 
  - Header: Logo, navigation menu, CTA buttons
  - Main: Dynamic content area
  - Footer: Links, social media, contact info

### DashboardLayout
- **Structure**: Header + Sidebar + Main Content
- **Components**:
  - Header: Logo, search bar, notifications, user avatar
  - Sidebar: Navigation menu, quick stats, shortcuts
  - Main: Page content with breadcrumbs

### SettingsLayout
- **Structure**: Header + Settings Sidebar + Content
- **Components**:
  - Header: Same as dashboard
  - Settings Sidebar: Settings categories
  - Content: Settings forms and options

### CommunityLayout
- **Structure**: Header + Community Sidebar + Feed + Right Panel
- **Components**:
  - Header: Same as dashboard
  - Community Sidebar: Community navigation
  - Feed: Main content area
  - Right Panel: Trending, suggestions

## 4. Section Structure by Page

### Dashboard Page
- **Hero Section**: Welcome message, daily summary
- **Quick Stats Section**: Calories, exercise, water intake
- **Progress Section**: Weight chart, goal progress
- **Recent Activity Section**: Latest food logs, exercises
- **AI Recommendations Section**: Personalized suggestions
- **Shortcuts Section**: Quick action buttons

### Food Log Page
- **Search Section**: Food search bar, filters
- **Quick Add Section**: Recent foods, favorites
- **Meal Sections**: Breakfast, lunch, dinner, snacks
- **Nutrition Summary Section**: Daily totals, macros
- **Scanner Section**: Barcode scanner widget

### Exercise Log Page
- **Quick Add Section**: Recent workouts, templates
- **Activity Tracker Section**: Steps, calories burned
- **Workout Builder Section**: Create custom workouts
- **Exercise Library Section**: Browse exercises
- **History Section**: Recent workout logs

### Reports Page
- **Filter Section**: Date range, report type
- **Summary Cards Section**: Key metrics
- **Charts Section**: Visual analytics
- **Insights Section**: AI-generated insights
- **Export Section**: Download reports

## 5. Routing Strategy

### Technology Choice: React Router v6
- **Reason**: Mature, feature-rich, excellent TypeScript support

### Route Structure
```javascript
// App.tsx
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<PublicLayout />}>
    <Route index element={<LandingPage />} />
    <Route path="login" element={<LoginPage />} />
    <Route path="register" element={<RegisterPage />} />
    <Route path="pricing" element={<PricingPage />} />
  </Route>

  {/* Protected Routes */}
  <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
    <Route index element={<DashboardPage />} />
    
    {/* Food Routes */}
    <Route path="food">
      <Route path="log" element={<FoodLogPage />} />
      <Route path="history" element={<MealHistoryPage />} />
      <Route path="recipes" element={<RecipeCreatorPage />} />
      <Route path="planner" element={<MealPlannerPage />} />
    </Route>

    {/* Exercise Routes */}
    <Route path="exercise">
      <Route path="log" element={<ExerciseLogPage />} />
      <Route path="history" element={<WorkoutHistoryPage />} />
      <Route path="templates" element={<WorkoutTemplatesPage />} />
    </Route>

    {/* Other nested routes... */}
  </Route>

  {/* Premium Routes */}
  <Route path="/premium" element={<PremiumRoute><PremiumLayout /></PremiumRoute>}>
    <Route path="analytics" element={<PremiumAnalyticsPage />} />
    <Route path="coaching" element={<CoachingPage />} />
  </Route>
</Routes>
```

### Route Guards
- **ProtectedRoute**: Checks authentication
- **PremiumRoute**: Checks premium subscription
- **GuestRoute**: Redirects authenticated users

## 6. State Management Plan

### Global State (Redux Toolkit + RTK Query)
**Why RTK**: Predictable state updates, excellent DevTools, built-in async handling

#### Global State Structure
```javascript
// store/
├── slices/
│   ├── authSlice.ts          // User authentication
│   ├── userSlice.ts          // User profile data
│   ├── foodSlice.ts          // Food logging data
│   ├── exerciseSlice.ts      // Exercise tracking
│   ├── goalsSlice.ts         // User goals
│   ├── notificationSlice.ts  // Notifications
│   └── themeSlice.ts         // UI theme
├── api/
│   ├── authApi.ts           // Auth endpoints
│   ├── foodApi.ts           // Food data endpoints
│   ├── exerciseApi.ts       // Exercise endpoints
│   ├── goalsApi.ts          // Goals endpoints
│   └── reportsApi.ts        // Analytics endpoints
└── store.ts
```

### Local State (useState, useReducer)
**Use Cases**:
- Form inputs and validation
- Modal open/close states
- Component-specific UI states
- Temporary data before API calls

### Context API
**Use Cases**:
- Theme provider
- Toast notification provider
- Modal provider
- User preferences

## 7. Styling & Theming Guide

### Technology Choice: Tailwind CSS + CSS-in-JS (Emotion)
**Reasoning**:
- Tailwind: Rapid development, consistency, mobile-first
- Emotion: Dynamic styles, theme integration, component-level styling

### Design System Structure
```
/src/styles/
├── tokens/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── breakpoints.ts
│   └── shadows.ts
├── themes/
│   ├── light.ts
│   ├── dark.ts
│   └── index.ts
├── components/
│   ├── GlobalStyles.tsx
│   └── ThemeProvider.tsx
└── utilities/
    ├── animations.ts
    └── mixins.ts
```

### Theme Configuration
```javascript
// themes/light.ts
export const lightTheme = {
  colors: {
    primary: {
      50: '#f0f9ff',
      500: '#3b82f6',
      900: '#1e3a8a',
    },
    success: {
      50: '#f0fdf4',
      500: '#10b981',
      900: '#064e3b',
    },
    // ... other colors
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Fira Code', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      // ... other sizes
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    // ... other spacing
  },
}
```

## 8. UI/UX Considerations

### Interaction Patterns
- **Loading States**: Skeleton screens, spinners, progress bars
- **Error Handling**: Toast notifications, inline error messages
- **Form Validation**: Real-time validation with clear feedback
- **Navigation**: Breadcrumbs, back buttons, clear hierarchy
- **Data Visualization**: Interactive charts, hover states, legends

### Accessibility (WCAG 2.1 AA)
- **Color Contrast**: Minimum 4.5:1 ratio
- **Keyboard Navigation**: Focus management, tab order
- **Screen Reader Support**: ARIA labels, semantic HTML
- **Alternative Text**: Images, charts, icons
- **Form Labels**: Proper labeling, error associations

### Mobile-First Design
- **Responsive Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch Targets**: Minimum 44px for interactive elements
- **Gesture Support**: Swipe navigation, pull-to-refresh
- **Performance**: Lazy loading, image optimization

### Notification System
```javascript
// Notification Types
- Success: Goal achieved, data saved
- Warning: Approaching limits, reminders
- Error: Failed operations, validation errors
- Info: Tips, feature announcements
```

## 9. Code Reusability and Best Practices

### Component Design Principles
- **Single Responsibility**: Each component has one clear purpose
- **Composition over Inheritance**: Build complex UI from simple components
- **Props Interface**: Well-defined TypeScript interfaces
- **Default Props**: Sensible defaults for optional props

### Naming Conventions
```
// Components: PascalCase
Button, FoodLogger, NutritionChart

// Files: PascalCase for components, camelCase for utilities
Button.tsx, foodApi.ts, authHelpers.ts

// CSS Classes: kebab-case (Tailwind standard)
btn-primary, food-card, nutrition-summary

// Constants: UPPER_SNAKE_CASE
API_BASE_URL, MAX_CALORIES_PER_DAY
```

### Code Organization
```
/src/
├── components/           # Reusable UI components
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── services/            # API services
├── store/               # State management
├── styles/              # Styling and themes
├── types/               # TypeScript type definitions
├── constants/           # Application constants
└── assets/              # Images, icons, fonts
```

### Custom Hooks Strategy
```javascript
// Data fetching hooks
useAuth(), useFoodLog(), useExerciseHistory()

// Form management hooks
useForm(), useFormValidation()

// UI state hooks
useModal(), useToast(), useLocalStorage()

// Business logic hooks
useCalorieCalculation(), useGoalProgress()
```

### Performance Optimization
- **Code Splitting**: Route-based and component-based splitting
- **Lazy Loading**: Images, components, data
- **Memoization**: React.memo, useMemo, useCallback
- **Virtual Scrolling**: For large lists (food database, exercise history)
- **Debouncing**: Search inputs, API calls

### Testing Strategy
- **Unit Tests**: Components, hooks, utilities (Jest + React Testing Library)
- **Integration Tests**: API interactions, form submissions
- **E2E Tests**: Critical user journeys (Cypress)
- **Visual Regression Tests**: UI consistency (Chromatic)

### Development Workflow
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Pre-commit Hooks**: Husky + lint-staged
- **Component Documentation**: Storybook
- **Design System**: Shared component library

This architecture provides a solid foundation for a scalable, maintainable health and nutrition tracking application. The modular structure allows for easy feature additions and team collaboration while maintaining code quality and user experience standards.