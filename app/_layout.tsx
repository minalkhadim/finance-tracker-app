import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="add-transaction" />
        <Stack.Screen name="history" />
        <Stack.Screen name="budget" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}