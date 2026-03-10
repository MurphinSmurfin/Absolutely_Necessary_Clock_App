import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DEFAULT_TIMEZONE_KEY } from "./constants/TIMEZONES";
import AboutPage from "./pages/AboutPage";
import ClockInPage from "./pages/ClockInPage";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";

function TopNav({ page, onChangePage }) {
  return (
    <View style={styles.navbar}>
      <View style={styles.navbarGlow} />
      <View style={styles.navbarInner}>
        <NavButton label="Home" active={page === "home"} onPress={() => onChangePage("home")} />
        <NavButton label="About" active={page === "about"} onPress={() => onChangePage("about")} />
        <NavButton label="Settings" active={page === "settings"} onPress={() => onChangePage("settings")} />
      </View>
    </View>
  );
}

function NavButton({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.navBtn, active && styles.navBtnActive, pressed && styles.navBtnPressed]}>
      <Text style={[styles.navBtnText, active && styles.navBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function Index() {
  const [page, setPage] = useState("home");
  const [glowPresetKey, setGlowPresetKey] = useState("off");
  const [timeFormat, setTimeFormat] = useState("24");
  const [timezoneKey, setTimezoneKey] = useState(DEFAULT_TIMEZONE_KEY);
  const [homePressCount, setHomePressCount] = useState(0);
  const homePressTimerRef = useRef(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedKey = await AsyncStorage.getItem("glowPresetKey");
        if (!storedKey) {
          setGlowPresetKey("off");
        }
        if (storedKey) {
          setGlowPresetKey(storedKey);
        }
        const storedFormat = await AsyncStorage.getItem("clockTimeFormat");
        if (storedFormat === "12" || storedFormat === "24") {
          setTimeFormat(storedFormat);
        }

        const storedTimezoneKey = await AsyncStorage.getItem("clockTimezoneKey");
        if (storedTimezoneKey) {
          setTimezoneKey(storedTimezoneKey);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    loadSettings();
  });

  const handleChangePage = (target) => {
    if (target === "home") {
      if (page === "clockin") {
        setPage("home");
        setHomePressCount(0);
        if (homePressTimerRef.current) {
          clearTimeout(homePressTimerRef.current);
          homePressTimerRef.current = null;
        }
        return;
      }

      const nextCount = homePressCount + 1;
      if (nextCount >= 3) {
        setPage("clockin");
        setHomePressCount(0);
        if (homePressTimerRef.current) {
          clearTimeout(homePressTimerRef.current);
          homePressTimerRef.current = null;
        }
      } else {
        setPage("home");
        setHomePressCount(nextCount);
        if (homePressTimerRef.current) {
          clearTimeout(homePressTimerRef.current);
        }
        homePressTimerRef.current = setTimeout(() => {
          setHomePressCount(0);
          homePressTimerRef.current = null;
        }, 1000);
      }
      return;
    }

    // Any non-home navigation resets the sequence.
    setHomePressCount(0);
    if (homePressTimerRef.current) {
      clearTimeout(homePressTimerRef.current);
      homePressTimerRef.current = null;
    }
    setPage(target);
  };

  const handleSetGlowPresetKey = async (newKey) => {
    setGlowPresetKey(newKey);
    await AsyncStorage.setItem("glowPresetKey", newKey);
    console.log("Saved glow preset key:", newKey);
  };

  const handleSetTimeFormat = async (newFormat) => {
    setTimeFormat(newFormat);
    try {
      await AsyncStorage.setItem("clockTimeFormat", newFormat);
    } catch (error) {
      console.error("Error saving time format:", error);
    }
  };

  const handleSetTimezoneKey = async (newKey) => {
    setTimezoneKey(newKey);
    try {
      await AsyncStorage.setItem("clockTimezoneKey", newKey);
    } catch (error) {
      console.error("Error saving timezone key:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <TopNav page={page} onChangePage={handleChangePage} />

        <View style={styles.pageContent}>
          {page === "home" ? <HomePage glowPresetKey={glowPresetKey} styles={styles} timeFormat={timeFormat} timezoneKey={timezoneKey} /> : null}
          {page === "clockin" ? (
            <ClockInPage
              glowPresetKey={glowPresetKey}
              styles={styles}
              timeFormat={timeFormat}
              timezoneKey={timezoneKey}
              onMidnightReset={() => handleChangePage("home")}
            />
          ) : null}
          {page === "about" ? <AboutPage glowPresetKey={glowPresetKey} styles={styles} /> : null}
          {page === "settings" ? (
            <SettingsPage
              glowPresetKey={glowPresetKey}
              onChangeGlowPresetKey={handleSetGlowPresetKey}
              timeFormat={timeFormat}
              onChangeTimeFormat={handleSetTimeFormat}
              timezoneKey={timezoneKey}
              onChangeTimezoneKey={handleSetTimezoneKey}
              styles={styles}
            />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  navbar: {
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  navbarGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 64,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  navbarInner: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(8, 8, 8, 0.80)",
    borderWidth: 1,
    borderColor: "#1D1D1D",
    borderRadius: 16,
    padding: 8,
  },
  navBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  navBtnActive: {
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    shadowColor: "#35C5FF",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  navBtnPressed: {
    opacity: 0.9,
  },
  navBtnText: {
    color: "#A6A6A6",
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  navBtnTextActive: {
    color: "#FFFFFF",
  },
  pageContent: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  clockPressable: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#050505",
    borderWidth: 0,
    borderColor: "transparent",
    alignSelf: "center",
  },
  clockPressablePressed: {
    // opacity: 0.9,
    // transform: [{ scale: 0.995 }],
  },
  clockFace: {
    borderRadius: 999,
    backgroundColor: "#050505",
    borderWidth: 2,
    borderColor: "#1E1E1E",
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
    height: "100%",
    flex: 1,
  },
  leftPane: {
    flex: 4,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  rightPane: {
    flex: 4,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  splitDividerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  splitDivider: {
    position: "absolute",
    top: "9%",
    bottom: "9%",
    width: 2,
    backgroundColor: "#2A2A2A",
    borderRadius: 2,
  },
  splitDot: {
    position: "absolute",
    top: "50%",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#3A3A3A",
    transform: [{ translateY: -4 }],
  },
  datePanel: {
    // width: "100%",
  },
  datePanelLeft: {
    alignItems: "flex-start",
  },
  datePanelCenter: {
    alignItems: "center",
  },
  dateText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  dayText: {
    color: "#A6A6A6",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  dateTextCenter: {
    textAlign: "center",
  },
  dayTextCenter: {
    textAlign: "center",
  },
  digitalTimeOnlyWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  digitalTimeOnly: {
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  pageCard: {
    width: "100%",
    maxWidth: 980,
    minHeight: 280,
    borderRadius: 24,
    backgroundColor: "rgba(6, 6, 6, 0.86)",
    borderWidth: 1,
    borderColor: "#1D1D1D",
    padding: 18,
  },
  pageTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  pageBody: {
    color: "#D6D6D6",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  pageBodyMuted: {
    marginTop: 10,
    color: "#8C8C8C",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  settingList: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#1D1D1D",
    borderRadius: 16,
    overflow: "hidden",
  },
  settingRow: {
    backgroundColor: "rgba(10, 10, 10, 0.8)",
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#141414",
  },
  settingRowFirst: {
    borderTopWidth: 0,
  },
  settingRowSelected: {
    backgroundColor: "rgba(18, 18, 18, 0.95)",
  },
  settingRowPressed: {
    opacity: 0.9,
  },
  settingText: {
    color: "#D6D6D6",
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  settingTextSelected: {
    color: "#FFFFFF",
  },
  settingPip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  settingPipSelected: {
    backgroundColor: "#35C5FF",
    borderColor: "#35C5FF",
  },
});
