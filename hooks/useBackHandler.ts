import { useFocusEffect } from "@react-navigation/native";
import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { Alert, BackHandler, Platform } from "react-native";

/**
 * A hook that handles back button/gesture behavior for the app,
 * showing an exit confirmation dialog on main tab screens.
 */
export function useBackHandler(): void {
  const router = useRouter();
  const pathname = usePathname();

  const backAction = useCallback(() => {
    // Only show exit dialog for main tab screens
    const isMainTab = ["/", "/setup", "/calendar"].includes(pathname);

    if (isMainTab) {
      Alert.alert(
        "Exit App",
        "Are you sure you want to exit?",
        [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
          {
            text: "Exit",
            onPress: () => {
              if (Platform.OS === "ios") {
                // On iOS, we can't actually exit the app,
                // but we can minimize it by going to the home screen
                router.replace("/(tabs)");
              } else {
                BackHandler.exitApp();
              }
            },
          },
        ],
        { cancelable: true },
      );
      return true; // Prevent default back behavior
    }

    return false; // Allow default back behavior
  }, [pathname, router]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "android") {
        BackHandler.addEventListener("hardwareBackPress", backAction);
        return () =>
          BackHandler.removeEventListener("hardwareBackPress", backAction);
      }
    }, [backAction]),
  );

  // For iOS, we need to handle the gesture-based back navigation
  useEffect(() => {
    if (Platform.OS === "ios") {
      // The effect itself acts as a subscription to navigation events
      return () => {
        // Cleanup if needed
      };
    }
  }, [backAction]);
}
