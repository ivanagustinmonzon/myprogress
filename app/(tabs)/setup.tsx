import { StyleSheet } from 'react-native';

import { View, Text } from 'react-native';

export default function SetupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setup</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 