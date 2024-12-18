import { StyleSheet, TouchableOpacity } from 'react-native';
import { View, Text } from 'react-native';

type HabitType = 'build' | 'break';
type OccurrenceType = 'daily' | 'custom';

interface Habit {
  type: HabitType;
  occurrence: OccurrenceType;
  notification: string;
}

export default function SetupScreen() {
  const handleHabitTypeSelection = (type: HabitType) => {
    // We'll implement navigation to next step here
    console.log('Selected habit type:', type);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setup habits</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.option} 
          onPress={() => handleHabitTypeSelection('build')}
        >
          <Text style={styles.optionText}>Build new habit</Text>
          <Text style={styles.optionDescription}>Create a new positive habit</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.option}
          onPress={() => handleHabitTypeSelection('break')}
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    marginTop: 60,
  },
  optionsContainer: {
    gap: 20,
  },
  option: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
}); 