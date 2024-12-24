import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useHabits } from "@/src/contexts/HabitContext";
import {
  calculateMinutesUntilNotification,
  createValidTime,
  filterHabitsByType,
  formatScheduleText,
  formatTimeDisplay,
  getNextReminderText,
  TimeError,
  ValidationError
} from "@/src/domain/habit";
import { clock } from "@/src/services/clock";
import { StoredHabit } from "@/src/types/storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function DailyContent() {
  const router = useRouter();
  const { habits, isLoading, refreshHabits } = useHabits();
  const [currentTime, setCurrentTime] = useState(clock.now());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(clock.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHabits();
    setRefreshing(false);
  };

  const buildHabits = filterHabitsByType(habits, "build");
  const breakHabits = filterHabitsByType(habits, "break");

  const handleHabitPress = (habit: StoredHabit) => {
    router.push({
      pathname: "/edit",
      params: { id: habit.id },
    });
  };

  const renderHabitItem = (habit: StoredHabit) => {
    try {
      const notificationTime = new Date(habit.notification.time);
      const validNotificationTime = createValidTime(notificationTime);
      const validCurrentTime = createValidTime(currentTime);

      if (
        !validNotificationTime.isValid ||
        !validCurrentTime.isValid ||
        !validNotificationTime.value ||
        !validCurrentTime.value
      ) {
        console.error("Invalid time values:", {
          notification: validNotificationTime.error,
          current: validCurrentTime.error,
        });
        return null;
      }

      const minutesUntilResult = calculateMinutesUntilNotification(
        validNotificationTime.value,
        validCurrentTime.value,
      );

      if (
        !minutesUntilResult.isValid ||
        minutesUntilResult.value === undefined
      ) {
        console.error(
          "Failed to calculate minutes until notification:",
          minutesUntilResult.error,
        );
        return null;
      }

      const timeDisplayResult = formatTimeDisplay(validNotificationTime.value);
      if (!timeDisplayResult.isValid || !timeDisplayResult.value) {
        console.error(
          "Failed to format time display:",
          timeDisplayResult.error,
        );
        return null;
      }

      return (
        <TouchableOpacity
          key={habit.id}
          style={styles.habitItem}
          onPress={() => handleHabitPress(habit)}
          activeOpacity={0.7}
        >
          <Text style={styles.habitName}>{habit.name}</Text>
          <Text style={styles.habitSchedule}>
            {formatScheduleText(
              habit.occurrence.type,
              habit.occurrence.type === "custom" ? habit.occurrence.days : [],
            )}
          </Text>
          <Text style={styles.habitTime}>
            Reminder at {timeDisplayResult.value}
          </Text>
          <Text
            style={[
              styles.habitTime,
              minutesUntilResult.value < 0 && styles.pastTime,
            ]}
          >
            {getNextReminderText(minutesUntilResult.value)}
          </Text>
        </TouchableOpacity>
      );
    } catch (error) {
      if (error instanceof ValidationError || error instanceof TimeError) {
        console.error(`Error rendering habit ${habit.id}:`, error.message);
        return null;
      }
      throw error;
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <Text>Loading habits...</Text>
      </View>
    );
  }

  const currentTimeValidation = createValidTime(currentTime);
  if (!currentTimeValidation.isValid || !currentTimeValidation.value) {
    console.error("Invalid current time:", currentTimeValidation.error);
    return null;
  }

  const currentTimeDisplay = formatTimeDisplay(currentTimeValidation.value);
  if (!currentTimeDisplay.isValid || !currentTimeDisplay.value) {
    console.error("Failed to format current time:", currentTimeDisplay.error);
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#2196f3"
          colors={["#2196f3"]}
        />
      }
    >
      <View style={styles.card}>
        <Text style={styles.title}>Habit Tracker</Text>
        <Text style={styles.utcTime}>
          Current UTC: {currentTime.toISOString().split(".")[0]}Z
        </Text>
        <Text style={styles.utcTime}>
          Local Time: {currentTimeDisplay.value}
        </Text>

        <View style={styles.habitsContainer}>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>Building:</Text>
            <View style={styles.habitList}>
              {buildHabits.length > 0 ? (
                buildHabits.map(renderHabitItem)
              ) : (
                <Text style={styles.emptyText}>No habits to build yet</Text>
              )}
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.columnTitle}>Breaking:</Text>
            <View style={styles.habitList}>
              {breakHabits.length > 0 ? (
                breakHabits.map(renderHabitItem)
              ) : (
                <Text style={styles.emptyText}>No habits to break yet</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export default function DailyScreen() {
  return (
    <ErrorBoundary>
      <DailyContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  habitsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
    marginHorizontal: 8,
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#2196f3",
  },
  habitList: {
    minHeight: 200,
    gap: 12,
  },
  habitItem: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196f3",
  },
  habitName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  habitSchedule: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  habitTime: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
  utcTime: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginBottom: 20,
    fontFamily: "monospace",
  },
  pastTime: {
    color: "#ff6b6b",
  },
});
