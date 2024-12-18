import { StyleSheet, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { View, Text } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import storage from '@/app/services/storage';
import { StoredHabit } from '@/app/types/storage';

export default function DailyScreen() {
  const router = useRouter();
  const [habits, setHabits] = useState<StoredHabit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHabits = async () => {
    try {
      setIsLoading(true);
      const allHabits = await storage.getAllHabits();
      setHabits(allHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load habits when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  }, []);

  const buildHabits = habits.filter(habit => habit.type === 'build' && habit.isActive);
  const breakHabits = habits.filter(habit => habit.type === 'break' && habit.isActive);

  const handleHabitPress = (habit: StoredHabit) => {
    router.push({
      pathname: '/edit',
      params: { id: habit.id }
    });
  };

  const renderHabitItem = (habit: StoredHabit) => (
    <TouchableOpacity
      key={habit.id}
      style={styles.habitItem}
      onPress={() => handleHabitPress(habit)}
      activeOpacity={0.7}
    >
      <Text style={styles.habitName}>{habit.name}</Text>
      <Text style={styles.habitSchedule}>
        {habit.occurrence.type === 'daily' 
          ? 'Every day'
          : `${habit.occurrence.days.length} days per week`}
      </Text>
      <Text style={styles.habitTime}>
        Reminder at {new Date(habit.notification.time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <Text>Loading habits...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#2196f3"
          colors={['#2196f3']}
        />
      }
    >
      <View style={styles.card}>
        <Text style={styles.title}>Habit Tracker</Text>
        
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
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
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  habitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginHorizontal: 8,
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2196f3',
  },
  habitList: {
    minHeight: 200,
    gap: 12,
  },
  habitItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  habitSchedule: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  habitTime: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
});
