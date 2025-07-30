# VitaTrack Design System

A comprehensive design system built with Tailwind CSS and shadcn/ui for the VitaTrack health and nutrition tracking application.

## Overview

The VitaTrack design system provides a consistent visual language and component library that ensures a cohesive user experience across the entire application. It's built on top of Tailwind CSS with custom design tokens and enhanced with shadcn/ui components.

## Design Principles

### 1. Health-Focused
- **Primary Color**: Emerald green (#10b981) representing health, vitality, and growth
- **Semantic Colors**: Intuitive color coding for nutrition (protein=red, carbs=orange, fat=purple)
- **Activity Colors**: Distinct colors for different exercise types

### 2. Accessibility First
- WCAG 2.1 AA compliant color contrasts
- Focus indicators for keyboard navigation
- Screen reader optimized components
- High contrast mode support

### 3. Responsive Design
- Mobile-first approach
- Flexible grid systems
- Adaptive typography scales
- Touch-friendly interactive elements

### 4. Performance Optimized
- Minimal CSS bundle size
- Efficient animations
- Reduced motion support
- Optimized for Core Web Vitals

## Color System

### Brand Colors
\`\`\`css
--brand-primary: #10b981    /* Emerald green */
--brand-secondary: #059669  /* Darker emerald */
--brand-accent: #34d399     /* Light emerald */
\`\`\`

### Semantic Colors
- **Success**: Green tones for positive actions and achievements
- **Warning**: Amber tones for cautions and alerts
- **Error**: Red tones for errors and destructive actions
- **Info**: Blue tones for informational content

### Nutrition Colors
- **Protein**: Red (#ef4444)
- **Carbohydrates**: Orange (#f59e0b)
- **Fat**: Purple (#8b5cf6)
- **Fiber**: Green (#22c55e)
- **Sugar**: Pink (#ec4899)
- **Sodium**: Indigo (#6366f1)

### Activity Colors
- **Cardio**: Red (#ef4444)
- **Strength**: Purple (#8b5cf6)
- **Flexibility**: Cyan (#06b6d4)
- **Sports**: Orange (#f59e0b)
- **Walking**: Green (#22c55e)

## Typography

### Font Families
- **Primary**: Inter (sans-serif) - Clean, readable, modern
- **Monospace**: JetBrains Mono - Code and data display
- **Display**: Cal Sans - Headlines and branding

### Type Scale
- **Display**: 4xl-9xl for hero sections and major headings
- **Headings**: xl-3xl for section titles and page headers
- **Body**: sm-lg for content and interface text
- **Caption**: xs-sm for metadata and secondary information

## Spacing System

Based on a 4px grid system with consistent spacing tokens:
- **Micro**: 1-4px for fine adjustments
- **Small**: 8-16px for component spacing
- **Medium**: 24-32px for section spacing
- **Large**: 48-64px for layout spacing
- **XLarge**: 80px+ for major layout divisions

## Component Variants

### Buttons
- **Sizes**: xs, sm, md, lg, xl
- **Variants**: primary, secondary, outline, ghost, link, destructive
- **States**: default, hover, active, disabled, loading

### Cards
- **Variants**: default, elevated, outlined, ghost
- **Padding**: none, sm, md, lg, xl
- **Interactive**: hover effects, focus states

### Inputs
- **Sizes**: sm, md, lg
- **Variants**: default, filled, underlined
- **States**: default, focus, error, disabled

## Layout System

### Container Sizes
- **Narrow**: 1024px max-width for focused content
- **Default**: 1280px max-width for general layouts
- **Wide**: 1536px max-width for dashboard views

### Grid System
- **Dashboard Grid**: Auto-fit columns with 300px minimum
- **Card Grid**: Responsive grid for card layouts
- **Form Grid**: Structured layouts for forms

## Animation System

### Durations
- **Fast**: 150ms for micro-interactions
- **Normal**: 300ms for standard transitions
- **Slow**: 500ms for complex animations

### Easing Functions
- **Linear**: Constant speed animations
- **Ease-out**: Natural deceleration
- **Bounce**: Playful spring animations

### Custom Animations
- **Fade In/Out**: Opacity transitions
- **Slide In**: Directional entrance animations
- **Scale In/Out**: Size-based transitions
- **Shimmer**: Loading state animations

## Accessibility Features

### Focus Management
- Visible focus indicators
- Logical tab order
- Skip links for navigation

### Color Accessibility
- Sufficient color contrast ratios
- Color-blind friendly palettes
- High contrast mode support

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and descriptions
- Screen reader only text utilities

## Dark Mode Support

Comprehensive dark mode implementation with:
- Automatic system preference detection
- Manual theme toggle
- Consistent color mappings
- Optimized contrast ratios

## Usage Examples

### Basic Card Component
\`\`\`tsx
<div className="card p-6">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-muted-foreground">Card content goes here.</p>
</div>
\`\`\`

### Nutrition Progress Bar
\`\`\`tsx
<div className="nutrition-bar">
  <div 
    className="nutrition-bar-fill nutrition-protein" 
    style={{ width: '75%' }}
  />
</div>
\`\`\`

### Responsive Grid
\`\`\`tsx
<div className="dashboard-grid">
  <div className="card">Item 1</div>
  <div className="card">Item 2</div>
  <div className="card">Item 3</div>
</div>
\`\`\`

## Customization

### Theme Variables
The design system uses CSS custom properties for easy theming:

\`\`\`css
:root {
  --primary: 142.1 76.2% 36.3%;
  --primary-foreground: 355.7 100% 97.3%;
  /* ... other variables */
}
\`\`\`

### Component Customization
Components can be customized using the `cn()` utility function:

\`\`\`tsx
import { cn } from "@/utils/helpers"

<Button className={cn("custom-styles", conditionalClass && "additional-styles")}>
  Custom Button
</Button>
\`\`\`

## Best Practices

### Do's
- Use semantic color names instead of specific color values
- Leverage the spacing scale for consistent layouts
- Apply focus states to all interactive elements
- Use the typography scale for consistent text sizing
- Implement proper loading states with skeleton components

### Don'ts
- Don't use arbitrary color values outside the design system
- Don't create custom spacing values without adding them to the scale
- Don't ignore accessibility requirements
- Don't use animations that could trigger motion sensitivity
- Don't override component styles without considering the design system

## Browser Support

- **Modern Browsers**: Full support for Chrome, Firefox, Safari, Edge
- **CSS Features**: CSS Grid, Flexbox, Custom Properties, Container Queries
- **Fallbacks**: Graceful degradation for older browsers
- **Progressive Enhancement**: Core functionality works without JavaScript

## Performance Considerations

- **CSS Bundle Size**: Optimized with PurgeCSS
- **Animation Performance**: GPU-accelerated transforms
- **Critical CSS**: Above-the-fold styles inlined
- **Font Loading**: Optimized web font delivery

## Contributing

When contributing to the design system:

1. Follow the established naming conventions
2. Add new tokens to the design-tokens.ts file
3. Update documentation for new components
4. Test accessibility compliance
5. Verify responsive behavior
6. Check dark mode compatibility

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
