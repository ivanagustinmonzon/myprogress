import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { OccurrenceType } from '@/app/types/habit';

export default function BuildHabitScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter();

  const handleOccurrenceSelection = (occurrence: 'daily' | 'custom') => {
    if (occurrence === 'custom') {
      router.push({
        pathname: '/setup/build/days',
        params: { name }
      });
    } else {
      // For daily, go straight to notification setup
      router.push({
        pathname: '/setup/build/notification',
        params: { 
          name,
          occurrence: 'daily'
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How often would you do it?</Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.option}
          onPress={() => handleOccurrenceSelection('daily')}
        >
          <Text style={styles.optionText}>Daily</Text>
          <Text style={styles.optionDescription}>I want to do this every day</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.option}
          onPress={() => handleOccurrenceSelection('custom')}
        >
          <Text style={styles.optionText}>Custom</Text>
          <Text style={styles.optionDescription}>I want to select specific days</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={styles.navigationButton}
          onPress={() => router.back()}
        >
          <Text style={styles.navigationButtonText}>Back</Text>
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
  },
  optionsContainer: {
    gap: 20,
    marginTop: 20,
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
  navigationContainer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  navigationButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
}); 