import { Stack } from 'expo-router';

export default function SetupLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="build"
        options={{
          title: 'Build New Habit',
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="break"
        options={{
          title: 'Break Old Habit',
          presentation: 'modal'
        }}
      />
    </Stack>
  );
} 