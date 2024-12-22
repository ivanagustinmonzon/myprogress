# MyProgress App

### To review:
Building: notification to remind you to do it
Breaking: review at the end of the day to check if did it


## Architecture Overview

This React Native application follows a feature-based architecture using Expo and Expo Router. The architecture is designed to be scalable, maintainable, and follows React Native best practices.

### Directory Structure

```
├── app/                    # Application routing and screens
│   ├── (tabs)/            # Tab-based navigation
│   ├── _layout.tsx        # Root layout configuration
│   └── +not-found.tsx     # 404 error handling
│
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI elements
│   ├── __tests__/        # Component tests
│   └── [Component].tsx   # Individual components
│
├── constants/            # Application-wide constants
│   └── Colors.ts        # Theme and color definitions
│
├── hooks/               # Custom React hooks
│   ├── useColorScheme   # Theme management
│   └── useThemeColor    # Color utilities
│
└── assets/             # Static assets (images, fonts, etc.)
```

### Key Architectural Decisions

1. **Routing & Navigation**
   - Uses Expo Router for file-based routing
   - Tab-based navigation structure in `app/(tabs)`
   - Centralized layout management in `_layout.tsx`

2. **Component Architecture**
   - Separation of UI components into reusable pieces
   - Component-specific tests in `__tests__` directory
   - Themed components for consistent styling

3. **State Management**
   - React's built-in state management
   - Custom hooks for shared logic
   - Theme management through dedicated hooks

4. **Styling & Theming**
   - Centralized color management in `constants/Colors.ts`
   - Theme-aware components using `useThemeColor`
   - Support for light/dark mode through `useColorScheme`

### Component Categories

1. **Base Components**
   - `ThemedText.tsx` - Text with theme support
   - `ThemedView.tsx` - Container with theme support
   - `ExternalLink.tsx` - External URL handling

2. **Interactive Components**
   - `Collapsible.tsx` - Expandable/collapsible content
   - `HapticTab.tsx` - Haptic feedback enabled tab
   - `ParallaxScrollView.tsx` - Scrolling with parallax effect

### Development Guidelines

1. **New Features**
   - Add new screens in the `app` directory
   - Create reusable components in `components`
   - Implement business logic in custom hooks

2. **Styling**
   - Use the theme system via `useThemeColor`
   - Define new colors in `Colors.ts`
   - Maintain consistent component styling

3. **Testing**
   - Place component tests in `__tests__` directory
   - Follow existing test patterns
