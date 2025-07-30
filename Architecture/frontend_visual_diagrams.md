# Health & Nutrition Tracking Website - Frontend Visual Diagrams

## 1. Site Map / Page Flow Diagram

```mermaid
flowchart TD
    A[Landing Page /] --> B[Login /login]
    A --> C[Register /register]
    A --> D[Pricing /pricing]
    A --> E[About /about]
    
    B --> F[Dashboard /dashboard]
    C --> F
    
    B --> G[Forgot Password /forgot-password]
    G --> H[Reset Password /reset-password/:token]
    
    F --> I[Profile /profile]
    F --> J[Food & Nutrition]
    F --> K[Exercise & Activity]
    F --> L[Goals & Progress]
    F --> M[Reports /reports]
    F --> N[Community /community]
    F --> O[Settings]
    
    J --> J1[Food Log /food/log]
    J --> J2[Meal History /food/history]
    J --> J3[Recipe Creator /food/recipes]
    J --> J4[Barcode Scanner /food/scanner]
    J --> J5[Meal Planner /food/planner]
    
    K --> K1[Exercise Log /exercise/log]
    K --> K2[Workout History /exercise/history]
    K --> K3[Workout Templates /exercise/templates]
    K --> K4[Activity Tracker /exercise/activity]
    
    L --> L1[Goal Setting /goals/set]
    L --> L2[Progress Tracking /goals/progress]
    
    N --> N1[Community Feed /community]
    N --> N2[Challenges /community/challenges]
    N --> N3[User Profile /community/profile/:userId]
    
    O --> O1[Account Settings /settings/account]
    O --> O2[Notification Settings /settings/notifications]
    O --> O3[Privacy Settings /settings/privacy]
    O --> O4[Integration Settings /settings/integrations]
    
    F --> P[Premium Features]
    P --> P1[Premium Analytics /premium/analytics]
    P --> P2[Personal Coaching /premium/coaching]
    P --> P3[Custom Meal Plans /premium/meal-plans]
    
    classDef publicPages fill:#e1f5fe
    classDef authPages fill:#f3e5f5
    classDef premiumPages fill:#fff3e0
    classDef mainFeatures fill:#e8f5e8
    
    class A,D,E publicPages
    class B,C,G,H authPages
    class P,P1,P2,P3 premiumPages
    class F,J,K,L,M,N mainFeatures
```

## 2. Component Hierarchy Tree (Dashboard Page)

```mermaid
graph TD
    A[DashboardPage] --> B[DashboardLayout]
    B --> C[Header]
    B --> D[Sidebar]
    B --> E[Main Content]
    
    C --> C1[Logo]
    C --> C2[SearchBar]
    C --> C3[NotificationBell]
    C --> C4[Avatar]
    
    D --> D1[Navigation Menu]
    D --> D2[Quick Stats]
    D --> D3[Shortcuts]
    
    E --> E1[Hero Section]
    E --> E2[Quick Stats Section]
    E --> E3[Progress Section]
    E --> E4[Recent Activity Section]
    E --> E5[AI Recommendations Section]
    
    E1 --> E1a[Typography - Welcome]
    E1 --> E1b[StatCard - Daily Summary]
    
    E2 --> E2a[StatCard - Calories]
    E2 --> E2b[StatCard - Exercise]
    E2 --> E2c[StatCard - Water]
    
    E3 --> E3a[ProgressChart - Weight]
    E3 --> E3b[GoalCard - Progress]
    
    E4 --> E4a[MealCard - Latest Foods]
    E4 --> E4b[ExerciseCard - Recent Workouts]
    
    E5 --> E5a[AIRecommendations]
    E5a --> E5a1[Button - Meal Suggestions]
    E5a --> E5a2[Button - Workout Tips]
    
    classDef layout fill:#e3f2fd
    classDef organism fill:#f1f8e9
    classDef molecule fill:#fff8e1
    classDef atom fill:#fce4ec
    
    class B,C,D,E layout
    class E1,E2,E3,E4,E5 organism
    class C1,C2,C3,C4,D1,D2,D3,E1b,E2a,E2b,E2c,E3a,E3b,E4a,E4b,E5a molecule
    class E1a,E5a1,E5a2 atom
```

## 3. Component Hierarchy Tree (Food Log Page)

```mermaid
graph TD
    A[FoodLogPage] --> B[DashboardLayout]
    B --> C[Header]
    B --> D[Sidebar]
    B --> E[Main Content]
    
    E --> E1[Search Section]
    E --> E2[Quick Add Section]
    E --> E3[Meal Sections]
    E --> E4[Nutrition Summary]
    E --> E5[Scanner Section]
    
    E1 --> E1a[SearchBar]
    E1 --> E1b[DropdownMenu - Filters]
    
    E2 --> E2a[FoodItem - Recent Foods]
    E2 --> E2b[FoodItem - Favorites]
    
    E3 --> E3a[MealCard - Breakfast]
    E3 --> E3b[MealCard - Lunch]
    E3 --> E3c[MealCard - Dinner]
    E3 --> E3d[MealCard - Snacks]
    
    E3a --> E3a1[Button - Add Food]
    E3a --> E3a2[FoodItem - Logged Foods]
    
    E4 --> E4a[CalorieCounter]
    E4 --> E4b[MacronutrientBar]
    E4 --> E4c[NutritionChart]
    
    E5 --> E5a[BarcodeScannerWidget]
    E5a --> E5a1[Button - Scan]
    E5a --> E5a2[Input - Manual Entry]
    
    classDef layout fill:#e3f2fd
    classDef organism fill:#f1f8e9
    classDef molecule fill:#fff8e1
    classDef atom fill:#fce4ec
    
    class B,C,D,E layout
    class E1,E2,E3,E4,E5 organism
    class E1a,E1b,E2a,E2b,E3a,E3b,E3c,E3d,E4a,E4b,E4c,E5a molecule
    class E3a1,E3a2,E5a1,E5a2 atom
```

## 4. Template / Layout Wireframe Diagrams

### DashboardLayout Wireframe
```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER                                  │
│  [Logo]  [SearchBar]           [Notifications] [Avatar]        │
├─────────────────────────────────────────────────────────────────┤
│        │                                                       │
│        │                 MAIN CONTENT                          │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │              Hero Section                       │  │
│        │  │     Welcome Message & Daily Summary            │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                       │
│ SIDEBAR│  ┌─────────────────────────────────────────────────┐  │
│        │  │              Quick Stats                        │  │
│ [Nav]  │  │   [Calories] [Exercise] [Water] [Sleep]        │  │
│        │  └─────────────────────────────────────────────────┘  │
│ [Quick │                                                       │
│ Stats] │  ┌─────────────────────────────────────────────────┐  │
│        │  │              Progress Charts                    │  │
│ [Short │  │      Weight Chart    Goal Progress             │  │
│ cuts]  │  └─────────────────────────────────────────────────┘  │
│        │                                                       │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │           Recent Activity                       │  │
│        │  │    Latest Foods    Recent Workouts             │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                       │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │         AI Recommendations                      │  │
│        │  │   Meal Suggestions   Workout Tips              │  │
│        │  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### AuthLayout Wireframe
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        [Logo]                                  │
│                                                                 │
│                 ┌─────────────────────────┐                    │
│                 │                         │                    │
│                 │      LOGIN FORM         │                    │
│                 │                         │                    │
│                 │  [Email Input]          │                    │
│                 │  [Password Input]       │                    │
│                 │                         │                    │
│                 │  [Login Button]         │                    │
│                 │                         │                    │
│                 │  [Forgot Password?]     │                    │
│                 │  [Sign Up Link]         │                    │
│                 │                         │                    │
│                 │  [Social Login]         │                    │
│                 │  [Google] [Apple]       │                    │
│                 │                         │                    │
│                 └─────────────────────────┘                    │
│                                                                 │
│                                                                 │
│           [Privacy Policy]  [Terms of Service]                 │
└─────────────────────────────────────────────────────────────────┘
```

### CommunityLayout Wireframe
```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER                                  │
│  [Logo]  [SearchBar]           [Notifications] [Avatar]        │
├─────────────────────────────────────────────────────────────────┤
│        │                                    │                  │
│        │          MAIN FEED                 │   RIGHT PANEL    │
│        │                                    │                  │
│ COMM.  │  ┌─────────────────────────────┐   │ ┌──────────────┐ │
│ SIDEBAR│  │         Post 1              │   │ │  Trending    │ │
│        │  │  [Avatar] [Username]        │   │ │  Topics      │ │
│ [Feed] │  │  [Post Content]             │   │ └──────────────┘ │
│        │  │  [Like] [Comment] [Share]   │   │                  │
│ [Chall │  └─────────────────────────────┘   │ ┌──────────────┐ │
│ enges] │                                    │ │  Suggested   │ │
│        │  ┌─────────────────────────────┐   │ │  Friends     │ │
│ [Groups│  │         Post 2              │   │ │              │ │
│ ]      │  │  [Avatar] [Username]        │   │ │  [User 1]    │ │
│        │  │  [Post Content]             │   │ │  [User 2]    │ │
│ [Leade │  │  [Like] [Comment] [Share]   │   │ │  [User 3]    │ │
│ rboard]│  └─────────────────────────────┘   │ └──────────────┘ │
│        │                                    │                  │
│        │  ┌─────────────────────────────┐   │ ┌──────────────┐ │
│        │  │      [Create Post]          │   │ │  Active      │ │
│        │  └─────────────────────────────┘   │ │  Challenges  │ │
│        │                                    │ └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 5. Folder/Directory Structure Tree

```
src/
├── components/
│   ├── atoms/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Label/
│   │   ├── Icon/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Spinner/
│   │   ├── ProgressBar/
│   │   ├── Toggle/
│   │   ├── Checkbox/
│   │   └── Typography/
│   ├── molecules/
│   │   ├── FormField/
│   │   ├── SearchBar/
│   │   ├── DatePicker/
│   │   ├── Modal/
│   │   ├── StatCard/
│   │   ├── CalorieCounter/
│   │   ├── MacronutrientBar/
│   │   ├── ExerciseCard/
│   │   ├── FoodItem/
│   │   ├── MealCard/
│   │   └── GoalCard/
│   ├── organisms/
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── Footer/
│   │   ├── DashboardSummary/
│   │   ├── FoodLogger/
│   │   ├── ExerciseTracker/
│   │   ├── NutritionChart/
│   │   ├── CalorieChart/
│   │   ├── ProgressChart/
│   │   ├── MealPlanCalendar/
│   │   ├── RecipeBuilder/
│   │   ├── WorkoutBuilder/
│   │   └── AIRecommendations/
│   └── templates/
│       ├── AuthLayout/
│       ├── DashboardLayout/
│       ├── PublicLayout/
│       ├── SettingsLayout/
│       ├── CommunityLayout/
│       └── ReportsLayout/
├── pages/
│   ├── public/
│   │   ├── LandingPage/
│   │   ├── LoginPage/
│   │   ├── RegisterPage/
│   │   └── PricingPage/
│   ├── dashboard/
│   │   └── DashboardPage/
│   ├── food/
│   │   ├── FoodLogPage/
│   │   ├── MealHistoryPage/
│   │   ├── RecipeCreatorPage/
│   │   └── MealPlannerPage/
│   ├── exercise/
│   │   ├── ExerciseLogPage/
│   │   ├── WorkoutHistoryPage/
│   │   └── ActivityTrackerPage/
│   ├── goals/
│   │   ├── GoalSettingPage/
│   │   └── ProgressTrackingPage/
│   ├── reports/
│   │   └── ReportsPage/
│   ├── community/
│   │   ├── CommunityFeedPage/
│   │   └── ChallengesPage/
│   ├── settings/
│   │   ├── AccountSettingsPage/
│   │   └── NotificationSettingsPage/
│   └── premium/
│       ├── PremiumAnalyticsPage/
│       └── CoachingPage/
├── hooks/
│   ├── useAuth.ts
│   ├── useFoodLog.ts
│   ├── useExerciseHistory.ts
│   ├── useForm.ts
│   ├── useModal.ts
│   ├── useToast.ts
│   ├── useCalorieCalculation.ts
│   └── useGoalProgress.ts
├── store/
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── userSlice.ts
│   │   ├── foodSlice.ts
│   │   ├── exerciseSlice.ts
│   │   ├── goalsSlice.ts
│   │   ├── notificationSlice.ts
│   │   └── themeSlice.ts
│   ├── api/
│   │   ├── authApi.ts
│   │   ├── foodApi.ts
│   │   ├── exerciseApi.ts
│   │   ├── goalsApi.ts
│   │   └── reportsApi.ts
│   └── store.ts
├── styles/
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── breakpoints.ts
│   │   └── shadows.ts
│   ├── themes/
│   │   ├── light.ts
│   │   ├── dark.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── GlobalStyles.tsx
│   │   └── ThemeProvider.tsx
│   └── utilities/
│       ├── animations.ts
│       └── mixins.ts
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── nutrition.ts
│   └── analytics.ts
├── utils/
│   ├── helpers.ts
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
├── types/
│   ├── auth.ts
│   ├── food.ts
│   ├── exercise.ts
│   ├── goals.ts
│   └── api.ts
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── App.tsx
├── main.tsx
└── index.html
```

## 6. State & Data Flow Diagram

```mermaid
graph TD
    A[User Action] --> B{Action Type}
    
    B -->|Authentication| C[Auth Slice]
    B -->|Food Logging| D[Food Slice]
    B -->|Exercise Tracking| E[Exercise Slice]
    B -->|Goal Setting| F[Goals Slice]
    B -->|UI Updates| G[Local State]
    
    C --> H[Auth API]
    D --> I[Food API]
    E --> J[Exercise API]
    F --> K[Goals API]
    
    H --> L[Backend Services]
    I --> L
    J --> L
    K --> L
    
    L --> M[Database]
    
    C --> N[Global State Store]
    D --> N
    E --> N
    F --> N
    
    N --> O[React Components]
    G --> O
    
    O --> P[UI Updates]
    P --> Q[User Interface]
    
    R[External APIs] --> S[Integration Services]
    S --> N
    
    T[Local Storage] --> U[User Preferences]
    U --> N
    
    V[Context Providers] --> W[Theme/Toast/Modal]
    W --> O
    
    classDef userAction fill:#ff9999
    classDef globalState fill:#99ccff
    classDef localState fill:#99ff99
    classDef api fill:#ffcc99
    classDef ui fill:#cc99ff
    
    class A,B userAction
    class C,D,E,F,N globalState
    class G,U,V,W localState
    class H,I,J,K,L,R,S api
    class O,P,Q ui
```

## 7. Diagram Usage Guide

### How to Use These Diagrams

1. **Site Map**: Use for understanding navigation flow and route structure
2. **Component Hierarchy**: Reference when building pages or refactoring components
3. **Wireframes**: Use as layout guides for UI development
4. **Directory Structure**: Follow for consistent file organization
5. **State Flow**: Reference for understanding data management patterns

### Integration with Development Tools

- **Mermaid Diagrams**: Can be rendered in GitHub README, GitLab, and most documentation tools
- **Directory Structure**: Copy-paste into project setup scripts
- **Component Hierarchy**: Use with component development tools like Storybook
- **Wireframes**: Reference for design system creation

### Maintenance Notes

- Update diagrams when adding new features or pages
- Keep component hierarchy in sync with actual implementation
- Review state flow when adding new data requirements
- Validate directory structure against actual project structure

These diagrams provide a comprehensive visual reference for the entire frontend architecture and can be easily integrated into your development workflow and documentation.