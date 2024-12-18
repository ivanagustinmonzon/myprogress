import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import storage from '@/app/services/storage';
import { StoredHabit } from '@/app/types/storage';
import { Days } from '@/app/types/habit';

export default function SuccessScreen() {
  const { 
    name, 
    occurrence, 
    days, 
    notification, 
    time 
  } = useLocalSearchParams();
  const router = useRouter();

  const parsedDays = days ? JSON.parse(days as string) : [];
  const parsedTime = time ? new Date(time as string) : new Date();
  const formattedTime = parsedTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const handleFinish = async () => {
    try {
      const habit: StoredHabit = {
        id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name as string,
        type: 'build',
        occurrence: {
          type: occurrence as 'daily' | 'custom',
          days: parsedDays as Days[],
        },
        notification: {
          message: notification as string,
          time: parsedTime.toISOString(),
        },
        createdAt: new Date().toISOString(),
        startDate: new Date().toISOString(),
        isActive: true,
      };

      const success = await storage.saveHabit(habit);
      
      if (success) {
        router.push('/');
      } else {
        Alert.alert(
          'Error',
          'Failed to save habit. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error saving habit:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
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
            {occurrence === 'daily' ? 'Every day' : 'Custom schedule'}
          </Text>
          
          {occurrence === 'custom' && parsedDays.length > 0 && (
            <Text style={styles.detailText}>
              {parsedDays.join(', ')}
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  habitName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2196f3',
    marginBottom: 30,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navigationButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  finishButton: {
    backgroundColor: '#2196f3',
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  finishButtonText: {
    color: '#fff',
  },
}); 