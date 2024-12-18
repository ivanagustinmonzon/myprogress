import { StyleSheet, View, Text, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import storage from '@/app/services/storage';
import { StoredHabit } from '@/app/types/storage';
import { Days } from '@/app/types/habit';

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [habit, setHabit] = useState<StoredHabit | null>(null);
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<Days[]>([]);
  const [message, setMessage] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHabit();
  }, [id]);

  const loadHabit = async () => {
    try {
      setIsLoading(true);
      const habits = await storage.getAllHabits();
      const foundHabit = habits.find(h => h.id === id);
      
      if (foundHabit) {
        setHabit(foundHabit);
        setName(foundHabit.name);
        setSelectedDays(foundHabit.occurrence.days);
        setMessage(foundHabit.notification.message);
        setTime(new Date(foundHabit.notification.time));
      } else {
        Alert.alert('Error', 'Habit not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading habit:', error);
      Alert.alert('Error', 'Failed to load habit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeChange = (_: any, selectedTime?: Date) => {
    if (selectedTime === undefined) {
      setShowTimePicker(false);
      return;
    }
    setTime(selectedTime);
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
  };

  const handleDayToggle = (day: Days) => {
    setSelectedDays(prev => {
      const isSelected = prev.includes(day);
      if (isSelected) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(
        title,
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Confirm',
            style: 'destructive',
            onPress: onConfirm
          }
        ]
      );
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      showConfirmation(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        () => router.replace('/(tabs)')
      );
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleDelete = () => {
    showConfirmation(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      async () => {
        if (!habit) return;
        
        try {
          const success = await storage.deleteHabit(habit.id);
          if (success) {
            router.replace('/(tabs)');
          } else {
            showAlert('Error', 'Failed to delete habit');
          }
        } catch (error) {
          console.error('Error deleting habit:', error);
          showAlert('Error', 'An unexpected error occurred');
        }
      }
    );
  };

  const handleSave = async () => {
    if (!habit) return;
    
    try {
      const updatedHabit: StoredHabit = {
        ...habit,
        name: name.trim(),
        occurrence: {
          type: habit.occurrence.type,
          days: selectedDays,
        },
        notification: {
          message: message.trim(),
          time: time.toISOString(),
        },
      };

      if (!updatedHabit.name || !updatedHabit.notification.message) {
        showAlert('Error', 'Name and notification message are required');
        return;
      }

      if (updatedHabit.occurrence.type === 'custom' && selectedDays.length === 0) {
        showAlert('Error', 'Please select at least one day');
        return;
      }

      const success = await storage.updateHabit(updatedHabit);
      
      if (success) {
        router.replace('/(tabs)');
      } else {
        showAlert('Error', 'Failed to update habit');
      }
    } catch (error) {
      console.error('Error updating habit:', error);
      showAlert('Error', 'An unexpected error occurred');
    }
  };

  const hasUnsavedChanges = useCallback(() => {
    if (!habit) return false;

    return (
      name.trim() !== habit.name ||
      message.trim() !== habit.notification.message ||
      time.toISOString() !== habit.notification.time ||
      JSON.stringify(selectedDays) !== JSON.stringify(habit.occurrence.days)
    );
  }, [habit, name, message, time, selectedDays]);

  if (isLoading || !habit) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Habit</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter habit name"
          placeholderTextColor="#999"
        />
      </View>

      {habit.occurrence.type === 'custom' && (
        <View style={styles.daysContainer}>
          <Text style={styles.label}>Days</Text>
          <View style={styles.daysGrid}>
            {Object.values(Days).map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayOption,
                  selectedDays.includes(day) && styles.daySelected
                ]}
                onPress={() => handleDayToggle(day)}
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
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Notification Message</Text>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Enter reminder message"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.timeContainer}>
        <Text style={styles.label}>Notification Time</Text>
        {Platform.OS === 'web' ? (
          <input
            type="time"
            value={`${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`}
            onChange={(event) => {
              const timeString = event.target.value; // Format: "HH:mm"
              const [hours, minutes] = timeString.split(':').map(Number);
              
              const newTime = new Date();
              newTime.setHours(hours);
              newTime.setMinutes(minutes);
              setTime(newTime);
            }}
            style={{
              fontSize: 16,
              padding: 16,
              width: '100%',
              borderRadius: 12,
              border: '1px solid #e0e0e0',
              backgroundColor: '#f5f5f5',
            }}
          />
        ) : Platform.OS === 'android' ? (
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.timeButtonText}>
              {time.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.iosPickerContainer}>
            <DateTimePicker
              value={time}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              style={styles.timePicker}
            />
          </View>
        )}

        {Platform.OS === 'android' && showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>

        <View style={styles.rightButtons}>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleCancel}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
          >
            <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
          </TouchableOpacity>
        </View>
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  daysContainer: {
    marginBottom: 20,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
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
  timeContainer: {
    marginBottom: 20,
  },
  timeButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  iosPickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  timePicker: {
    height: 120,
    width: '100%',
  },
  buttonContainer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#2196f3',
  },
  deleteButton: {
    backgroundColor: '#ff5252',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButtonText: {
    color: '#fff',
  },
}); 