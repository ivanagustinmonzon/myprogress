import { StyleSheet } from 'react-native';

import { View, Text } from 'react-native';

export default function DailyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Habit Tracker</Text>
        
        <View style={styles.habitsContainer}>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>Building:</Text>
            <View style={styles.habitList}>
              {/* Building habits will be added here */}
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.columnTitle}>Breaking:</Text>
            <View style={styles.habitList}>
              {/* Breaking habits will be added here */}
            </View>
          </View>
        </View>
      </View>
    </View>
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
  },
  habitList: {
    minHeight: 200,
  },
});
