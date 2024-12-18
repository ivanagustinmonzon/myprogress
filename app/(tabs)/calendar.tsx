import { StyleSheet } from 'react-native';
import { View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useMemo } from 'react';

export default function CalendarScreen() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Example period (this would come from your actions/props later)
  const period = {
    start: '2024-12-11',
    end: today
  };

  // Calculate marked dates for the period
  const { markedDates } = useMemo(() => {
    const marked: { [key: string]: any } = {};
    
    // Convert dates to Date objects for comparison
    let currentDate = new Date(period.start);
    const endDate = new Date(period.end);
    
    // Iterate through each date in the range
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      marked[dateString] = {
        color: '#50cebb', // Period color - customize as needed
        startingDay: dateString === period.start,
        endingDay: dateString === period.end
      };
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      markedDates: marked
    };
  }, [period.start, period.end]);

  const handleDayPress = (day: DateData) => {
    console.log('selected day', day);
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={today}
        minDate={'2024-01-01'}
        maxDate={today}
        onDayPress={handleDayPress}
        markingType="period"
        markedDates={markedDates}
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