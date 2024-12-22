import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import notifications from "@/src/services/notifications";
import { Days, ISODateString } from "@/src/types/habit";
import storage from "@/src/services/storage";
import { HabitId, StoredHabit } from "@/src/types/storage";
import { useHabits } from "@/src/contexts/HabitContext";

const SuccessScreen = () => {
  const { name, occurrence, days, notification, time } = useLocalSearchParams();
  const router = useRouter();
  const { saveHabit } = useHabits();

  // Validate required params
  if (!name || !occurrence || !days || !notification || !time) {
    Alert.alert(
      "Error",
      "Missing required information. Please go back and fill in all fields.",
      [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ],
    );
    return null;
  }

  const parsedDays = days ? JSON.parse(days as string) : [];
  const formattedTime = new Date(time as string).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const validateHabitData = (habit: StoredHabit): boolean => {
    if (!habit.name.trim()) return false;
    if (!habit.notification.message.trim()) return false;
    if (
      habit.occurrence.type === "custom" &&
      habit.occurrence.days.length === 0
    )
      return false;
    try {
      new Date(habit.notification.time); // Validate time format
      return true;
    } catch {
      console.error("Invalid time format:", habit.notification.time);
      return false;
    }
  };

  const handleFinish = async () => {
    try {
      const now = new Date().toISOString();
      const habit: StoredHabit = {
        id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as HabitId,
        name: name as string,
        type: "build",
        occurrence: {
          type: occurrence as "daily" | "custom",
          days: parsedDays,
        },
        notification: {
          message: notification as string,
          time: time as string,
        },
        createdAt: now as ISODateString,
        startDate: now as ISODateString,
        isActive: true,
      };

      if (!validateHabitData(habit)) {
        Alert.alert("Error", "Invalid habit data. Please check all fields.", [
          { text: "OK" },
        ]);
        return;
      }

      const success = await saveHabit(habit);

      if (success) {
        // First navigate to the setup index
        await router.replace("/setup");
        // Then navigate to the main tabs
        router.replace("/(tabs)");
      } else {
        Alert.alert("Error", "Failed to save habit. Please try again.", [
          { text: "OK" },
        ]);
      }
    } catch (error) {
      console.error("Error saving habit:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Congratulations!</Text>
        <Text style={styles.subtitle}>New habit to build:</Text>
        <Text style={styles.habitName}>{name}</Text>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Schedule:</Text>
          <Text style={styles.detailText}>
            {occurrence === "daily" ? "Every day" : "Custom schedule"}
          </Text>

          {occurrence === "custom" && parsedDays.length > 0 && (
            <Text style={styles.detailText}>
              {parsedDays
                .map((day: Days) => day.charAt(0) + day.slice(1).toLowerCase())
                .join(", ")}
            </Text>
          )}

          <Text style={styles.detailLabel}>Notification:</Text>
          <Text style={styles.detailText}>{notification}</Text>
          <Text style={styles.detailText}>at {formattedTime}</Text>
        </View>
      </View>

      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={styles.navigationButton}
          onPress={() => router.back()}
        >
          <Text style={styles.navigationButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navigationButton, styles.finishButton]}
          onPress={handleFinish}
        >
          <Text style={[styles.navigationButtonText, styles.finishButtonText]}>
            Finish
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SuccessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 10,
  },
  habitName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2196f3",
    marginBottom: 30,
  },
  detailsContainer: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navigationButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  finishButton: {
    backgroundColor: "#2196f3",
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  finishButtonText: {
    color: "#fff",
  },
});
