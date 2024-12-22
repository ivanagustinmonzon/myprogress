import { StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { HabitType } from "@/src/types/habit";
import { useState } from "react";

export default function SetupScreen() {
  const router = useRouter();
  const [habitName, setHabitName] = useState("");

  const handleHabitTypeSelection = (type: HabitType) => {
    if (!habitName.trim()) {
      // TODO: Add proper error handling/feedback
      return;
    }
    const path = type === "build" ? "/setup/build" : "/setup/break";
    router.push({
      pathname: path,
      params: { name: habitName },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setup habits</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>What's your habit called?</Text>
        <TextInput
          style={styles.input}
          value={habitName}
          onChangeText={setHabitName}
          placeholder="Enter habit name"
          placeholderTextColor="#999"
          autoFocus
          returnKeyType="next"
        />
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.option, !habitName.trim() && styles.optionDisabled]}
          onPress={() => handleHabitTypeSelection("build")}
          disabled={!habitName.trim()}
        >
          <Text style={styles.optionText}>Build new habit</Text>
          <Text style={styles.optionDescription}>
            Create a new positive habit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, !habitName.trim() && styles.optionDisabled]}
          onPress={() => handleHabitTypeSelection("break")}
          disabled={!habitName.trim()}
        >
          <Text style={styles.optionText}>Break old habit</Text>
          <Text style={styles.optionDescription}>Stop an existing habit</Text>
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
    marginTop: 60,
  },
  inputContainer: {
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
  optionsContainer: {
    gap: 20,
  },
  option: {
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666",
  },
});
