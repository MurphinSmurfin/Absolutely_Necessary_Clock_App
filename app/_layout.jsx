import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useCallback, useEffect } from "react";
import { AppState, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const hideNavigationBar = useCallback(async () => {
    if (Platform.OS === "android") {
      try {
        await new Promise((resolve) => setTimeout(resolve, 50)); // small delay
        await NavigationBar.setVisibilityAsync("hidden");
        await SystemUI.setBackgroundColorAsync("transparent");
      } catch (error) {
        console.error("❌ Failed to hide navigation bar:", error);
      }
    }
  }, []);

  // Handle app state changes to auto-hide navigation bar
  const handleAppStateChange = useCallback(
    (nextAppState) => {
      if (nextAppState === "active") {
        // Hide again when app becomes active
        setTimeout(() => {
          hideNavigationBar();
        }, 100);
      }
    },
    [hideNavigationBar]
  );

  // Subscribe to app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription?.remove();
    };
  }, [handleAppStateChange]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <StatusBar hidden={true} />
        <View style={{ flex: 1 }} onLayout={hideNavigationBar}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
