# VitaTrack Frontend

A comprehensive health and nutrition tracking application built with Next.js, TypeScript, and modern web technologies.

## 🚀 Features

- **Nutrition Tracking**: Log meals, track calories, and monitor macronutrients
- **Exercise Monitoring**: Record workouts and track physical activity
- **Goal Setting**: Set and track health and fitness goals
- **AI Recommendations**: Get personalized meal and workout suggestions
- **Community Features**: Connect with other users and join challenges
- **Premium Analytics**: Advanced insights and reporting (Premium)
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit + React Query
- **UI Components**: Custom components with Radix UI primitives
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier

## 📁 Project Structure

\`\`\`
src/
├── components/          # Reusable UI components (Atomic Design)
│   ├── atoms/          # Basic building blocks
│   ├── molecules/      # Simple component combinations
│   ├── organisms/      # Complex UI sections
│   └── templates/      # Page layouts
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── store/              # Redux store and slices
├── services/           # API services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── styles/             # Global styles and themes
\`\`\`

## 🚦 Getting Started

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Set up environment variables**:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   Fill in your environment variables.

3. **Run the development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## 🎨 Design System

The project follows Atomic Design principles:

- **Atoms**: Basic UI elements (Button, Input, Label)
- **Molecules**: Simple combinations (SearchBar, StatCard)
- **Organisms**: Complex sections (Header, Sidebar, Charts)
- **Templates**: Page layouts (DashboardLayout, AuthLayout)
- **Pages**: Complete pages (Dashboard, FoodLog, Exercise)

## 🔧 Configuration

### ESLint & Prettier
The project includes comprehensive linting and formatting rules for consistent code quality.

### TypeScript
Strict TypeScript configuration with path mapping for clean imports.

### Tailwind CSS
Custom design system with CSS variables for theming support.

## 🚀 Deployment

The application is optimized for deployment on Vercel:

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 📱 PWA Support

The application includes Progressive Web App features:
- Service worker for offline functionality
- Web app manifest for installation
- Optimized performance and caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
