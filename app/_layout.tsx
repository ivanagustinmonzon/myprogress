import { Stack } from 'expo-router';
import { HabitProvider } from './contexts/HabitContext';
import { NotificationProvider } from './contexts/NotificationContext';

export default function RootLayout() {
  return (
    <HabitProvider>
      <NotificationProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="(tabs)"
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="edit"
            options={{
              presentation: 'modal',
              headerShown: false
            }}
          />
        </Stack>
      </NotificationProvider>
    </HabitProvider>
  );
}
