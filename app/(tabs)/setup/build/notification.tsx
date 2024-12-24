import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";

import { clock } from "@/src/services/clock";

export default function NotificationScreen() {
  const { name, occurrence, days } = useLocalSearchParams();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [time, setTime] = useState(clock.now());
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === "ios");

  const handleTimeChange = (_: any, selectedTime?: Date) => {
    if (selectedTime === undefined) {
      setShowTimePicker(false);
      return;
    }
    setTime(selectedTime);
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
  };

  const handleWebTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const timeString = event.target.value; // Format: "HH:mm"
    const [hours, minutes] = timeString.split(":").map(Number);

    const newTime = clock.now();
    newTime.setHours(hours);
    newTime.setMinutes(minutes);
    setTime(newTime);
  };

  const handleNext = () => {
    if (!message.trim()) return;

    router.push({
      pathname: "/setup/build/success",
      params: {
        name,
        occurrence,
        days,
        notification: message,
        time: time.toISOString(),
      },
    });
  };

  const formattedTime = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const webTimeString = `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;

  const renderTimePicker = () => {
    if (Platform.OS === "web") {
      return (
        <input
          type="time"
          value={webTimeString}
          onChange={handleWebTimeChange}
          style={{
            fontSize: 16,
            padding: 16,
            width: "100%",
            borderRadius: 12,
            border: "1px solid #e0e0e0",
            backgroundColor: "#f5f5f5",
          }}
        />
      );
    }

    if (Platform.OS === "android") {
      return (
        <>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.timeButtonText}>{formattedTime}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </>
      );
    }

    return (
      <View style={styles.iosPickerContainer}>
        <DateTimePicker
          value={time}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
          style={styles.timePicker}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How would you like to be notified?</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Notification message</Text>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Enter your reminder message"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.timeContainer}>
        <Text style={styles.label}>What time?</Text>
        {renderTimePicker()}
      </View>

      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={styles.navigationButton}
          onPress={() => router.back()}
        >
          <Text style={styles.navigationButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navigationButton,
            styles.finishButton,
            !message.trim() && styles.finishButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!message.trim()}
        >
          <Text style={[styles.navigationButtonText, styles.finishButtonText]}>
            Finish
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 30,
  },
  timeContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  timeButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  timeButtonText: {
    fontSize: 16,
    color: "#333",
  },
  iosPickerContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  timePicker: {
    height: 120,
    width: "100%",
  },
  navigationContainer: {
    marginTop: "auto",
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
  finishButtonDisabled: {
    opacity: 0.5,
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
