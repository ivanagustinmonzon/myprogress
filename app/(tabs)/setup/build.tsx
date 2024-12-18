import { StyleSheet, View, Text } from 'react-native';

export default function BuildHabitScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What habit would you like to build?</Text>
      {/* We'll add form components here */}
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
}); 