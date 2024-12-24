import { Stack } from "expo-router";

import { HabitProvider } from "@/src/contexts/HabitContext";
import { NotificationProvider } from "@/src/contexts/NotificationContext";

export default function RootLayout() {
  return (
    <HabitProvider>
      <NotificationProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="edit"
            options={{
              presentation: "modal",
              headerShown: false,
            }}
          />
        </Stack>
      </NotificationProvider>
    </HabitProvider>
  );
}
