import { Stack } from 'expo-router';

export default function SetupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index"
      />
      <Stack.Screen 
        name="build"
        options={{
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="build/notification"
        options={{
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="build/success"
        options={{
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="break"
        options={{
          presentation: 'modal'
        }}
      />
    </Stack>
  );
} 