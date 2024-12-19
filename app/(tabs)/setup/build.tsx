import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Days, DAYS } from '@/app/types/habit';
import { useState } from 'react';

export default function BuildHabitScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter();
  const [selectedOccurrence, setSelectedOccurrence] = useState<'daily' | 'custom' | null>(null);
  const [selectedDays, setSelectedDays] = useState<Days[]>([]);

  const handleOccurrenceSelection = (occurrence: 'daily' | 'custom') => {
    setSelectedOccurrence(occurrence);
    if (occurrence === 'daily') {
      setSelectedDays(DAYS.map(day => day));
    } else {
      setSelectedDays([]);
    }
  };

  const handleDayToggle = (day: Days) => {
    if (selectedOccurrence !== 'custom') return;

    setSelectedDays(prev => {
      const isSelected = prev.includes(day);
      if (isSelected) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const handleNext = () => {
    if (!selectedOccurrence) return;
    if (selectedOccurrence === 'custom' && selectedDays.length === 0) return;
    
    router.push({
      pathname: '/setup/build/notification',
      params: {
        name,
        occurrence: selectedOccurrence,
        days: JSON.stringify(selectedDays)
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How often would you do it?</Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={[
            styles.option,
            selectedOccurrence === 'daily' && styles.optionSelected
          ]}
          onPress={() => handleOccurrenceSelection('daily')}
        >
          <Text style={styles.optionText}>Daily</Text>
          <Text style={styles.optionDescription}>I want to do this every day</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.option,
            selectedOccurrence === 'custom' && styles.optionSelected
          ]}
          onPress={() => handleOccurrenceSelection('custom')}
        >
          <Text style={styles.optionText}>Custom</Text>
          <Text style={styles.optionDescription}>I want to select specific days</Text>
        </TouchableOpacity>
      </View>

      <View style={[
        styles.daysContainer,
        selectedOccurrence !== 'custom' && styles.daysContainerDisabled
      ]}>
        {DAYS.map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayOption,
              selectedDays.includes(day) && styles.daySelected
            ]}
            onPress={() => handleDayToggle(day)}
            disabled={selectedOccurrence !== 'custom'}
          >
            <Text style={[
              styles.dayText,
              selectedDays.includes(day) && styles.dayTextSelected
            ]}>
              {day.charAt(0) + day.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
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
            styles.nextButton,
            (!selectedOccurrence || (selectedOccurrence === 'custom' && selectedDays.length === 0)) && 
              styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!selectedOccurrence || (selectedOccurrence === 'custom' && selectedDays.length === 0)}
        >
          <Text style={[
            styles.navigationButtonText,
            styles.nextButtonText
          ]}>Next</Text>
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
  optionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 1,
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
  daysContainer: {
    marginTop: 30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  daysContainerDisabled: {
    opacity: 0.5,
  },
  dayOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  daySelected: {
    backgroundColor: '#2196f3',
  },
  dayText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#fff',
  },
  navigationContainer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navigationButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  nextButton: {
    backgroundColor: '#2196f3',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  nextButtonText: {
    color: '#fff',
  },
}); 