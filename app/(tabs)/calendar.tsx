import { StyleSheet } from 'react-native';
import { View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function CalendarScreen() {
  return (
    <View style={styles.container}>
      <Calendar
        // Initially visible month. Default = now
        current={new Date().toISOString().split('T')[0]}
        // Minimum date that can be selected, dates before minDate will be grayed out
        minDate={'2024-01-01'}
        // Handler which gets executed on day press
        onDayPress={(day: any) => {
          console.log('selected day', day);
        }}
        // Mark specific dates as marked
        markedDates={{}}
        // Enable the option to swipe between months
        enableSwipeMonths={true}
        style={styles.calendar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  calendar: {
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
}); 