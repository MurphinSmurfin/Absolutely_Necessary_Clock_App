import Constants from "expo-constants";
import { useMemo, useRef, useState } from "react";
import { Alert, FlatList, Modal, Platform, Pressable, Switch, Text, ToastAndroid, useWindowDimensions, View } from "react-native";
import AnimatedGlow from "react-native-animated-glow";
import { HCESession, NFCTagType4, NFCTagType4NDEFContentType } from "react-native-hce";
import { GLOW_PRESETS } from "../constants/GLOW_PRESETS";
import { DEFAULT_TIMEZONE_KEY, TIMEZONE_OPTIONS } from "../constants/TIMEZONES";

export default function SettingsPage({
  glowPresetKey,
  onChangeGlowPresetKey,
  timeFormat,
  onChangeTimeFormat,
  timezoneKey = DEFAULT_TIMEZONE_KEY,
  onChangeTimezoneKey,
  styles,
}) {
  const { width, height } = useWindowDimensions();

  const appVersion = useMemo(() => {
    return Constants.expoConfig?.version;
  }, []);

  const glowOptions = useMemo(() => {
    return Object.entries(GLOW_PRESETS).map(([key, preset]) => ({
      key,
      name: preset.metadata?.name ?? key,
    }));
  }, []);

  const layout = useMemo(() => {
    const containerWidth = Math.max(260, Math.round(width * 0.8));
    const containerHeight = Math.max(260, Math.round(height * 0.75));
    return { containerWidth, containerHeight };
  }, [width, height]);

  const activePreset = GLOW_PRESETS[glowPresetKey] ?? GLOW_PRESETS.off;
  const is24Hour = timeFormat === "24";
  const effectiveTimezoneKey = timezoneKey || DEFAULT_TIMEZONE_KEY;
  const [timezoneModalVisible, setTimezoneModalVisible] = useState(false);
  const [glowModalVisible, setGlowModalVisible] = useState(false);
  const [hceEnabled, setHceEnabled] = useState(false);
  const sessionRef = useRef(null);
  const hceListenerRef = useRef(null);
  const hceReadHandledRef = useRef(false);

  const stopHceSession = async () => {
    const session = sessionRef.current;
    const removeListener = hceListenerRef.current;

    if (removeListener) {
      removeListener();
      hceListenerRef.current = null;
    }

    if (session) {
      await session.setEnabled(false);
      sessionRef.current = null;
    }
    setHceEnabled(false);
  };

  const showMessage = (title, message) => {
    if (Platform.OS === "android") {
      try {
        ToastAndroid.show(message ?? title, ToastAndroid.SHORT);
      } catch (_e) {
        // fallback
        Alert.alert(title, message);
      }
    } else {
      Alert.alert(title, message);
    }
  };

  const currentTimezoneLabel = useMemo(() => {
    const match = TIMEZONE_OPTIONS.find((opt) => opt.key === effectiveTimezoneKey);
    return match?.label ?? "Unknown timezone";
  }, [effectiveTimezoneKey]);

  const currentGlowLabel = useMemo(() => {
    const match = glowOptions.find((opt) => opt.key === glowPresetKey);
    return match?.name ?? glowPresetKey;
  }, [glowOptions, glowPresetKey]);

  return (
    <AnimatedGlow preset={activePreset} activeState="default">
      <View
        style={[
          styles.pageCard,
          {
            width: layout.containerWidth,
            maxWidth: layout.containerWidth,
            height: layout.containerHeight,
            minHeight: layout.containerHeight,
            alignSelf: "center",
            borderWidth: 0,
          },
        ]}
      >
        <Text style={styles.pageTitle}>Settings</Text>

        <Text style={styles.pageBodyMuted}>Time format</Text>

        <View style={styles.settingList}>
          <View style={[styles.settingRow, styles.settingRowFirst]}>
            <Text style={styles.settingText}>24-hour format</Text>
            <Switch
              value={is24Hour}
              onValueChange={(value) => onChangeTimeFormat(value ? "24" : "12")}
              trackColor={{ false: "#1D1D1D", true: "#35C5FF" }}
              thumbColor="#FFFFFF"
              style={{ transform: [{ scale: 0.8 }] }}
            />
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <Pressable
            onPress={async () => {
              try {
                if (Platform.OS !== "android") {
                  showMessage("HCE", "HCE emulation is only supported on Android devices.");
                  return;
                }
                const tag = new NFCTagType4({
                  type: NFCTagType4NDEFContentType.URL,
                  content: "https://instagram.com/bitsofmurph",
                  writable: false,
                });
                const session = await HCESession.getInstance();
                session.setApplication(tag);
                await session.setEnabled(true);
                hceReadHandledRef.current = false;
                if (hceListenerRef.current) {
                  hceListenerRef.current();
                }
                hceListenerRef.current = session.on(HCESession.Events.HCE_STATE_READ, () => {
                  if (hceReadHandledRef.current) {
                    return;
                  }
                  hceReadHandledRef.current = true;

                  const removeListener = hceListenerRef.current;
                  if (removeListener) {
                    removeListener();
                    hceListenerRef.current = null;
                  }

                  showMessage("HCE", "The tag has been read! Thank You.");
                  void stopHceSession();
                });
                sessionRef.current = session;
                setHceEnabled(true);
                showMessage("HCE", "NFC emulation started (tap an NFC reader to read the URL)");
              } catch (err) {
                console.error(err);
                showMessage("HCE error", String(err));
              }
            }}
            style={({ pressed }) => [styles.settingRow, styles.settingRowFirst, pressed && styles.settingRowPressed]}
          >
            <Text style={styles.settingText}>Start NFC emulation (open Instagram URL)</Text>
            <Text style={[styles.settingText, { color: "#8C8C8C" }]}>{hceEnabled ? "Running" : "Stopped"}</Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              try {
                const session = sessionRef.current;
                if (!session) {
                  showMessage("HCE", "No active HCE session");
                  return;
                }
                await stopHceSession();
                showMessage("HCE", "NFC emulation stopped");
              } catch (err) {
                console.error(err);
                showMessage("HCE error", String(err));
              }
            }}
            style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed, { marginTop: 8 }]}
          >
            <Text style={styles.settingText}>Stop NFC emulation</Text>
            <View style={{ width: 8 }} />
          </Pressable>
        </View>

        <Text style={styles.pageBodyMuted}>Timezone</Text>

        <View style={styles.settingList}>
          <Pressable
            onPress={() => setTimezoneModalVisible(true)}
            style={({ pressed }) => [styles.settingRow, styles.settingRowFirst, pressed && styles.settingRowPressed]}
          >
            <Text style={styles.settingText}>Timezone</Text>
            <Text style={[styles.settingText, { color: "#8C8C8C" }]} numberOfLines={1}>
              {currentTimezoneLabel}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.pageBodyMuted}>Glow preset</Text>

        <View style={styles.settingList}>
          <Pressable
            onPress={() => setGlowModalVisible(true)}
            style={({ pressed }) => [styles.settingRow, styles.settingRowFirst, pressed && styles.settingRowPressed]}
          >
            <Text style={styles.settingText}>Glow preset</Text>
            <Text style={[styles.settingText, { color: "#8C8C8C" }]} numberOfLines={1}>
              {currentGlowLabel}
            </Text>
          </Pressable>
        </View>

        <Modal visible={timezoneModalVisible} transparent animationType="fade" onRequestClose={() => setTimezoneModalVisible(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                maxHeight: "80%",
                width: "100%",
                borderRadius: 20,
                backgroundColor: "#060606",
                borderWidth: 1,
                borderColor: "#1D1D1D",
                paddingVertical: 10,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "800",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                Select timezone
              </Text>
              <FlatList
                data={TIMEZONE_OPTIONS}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => {
                  const selected = item.key === effectiveTimezoneKey;
                  return (
                    <Pressable
                      onPress={() => {
                        if (onChangeTimezoneKey) {
                          onChangeTimezoneKey(item.key);
                        }
                        setTimezoneModalVisible(false);
                      }}
                      style={({ pressed }) => [
                        styles.settingRow,
                        styles.settingRowFirst,
                        selected && styles.settingRowSelected,
                        pressed && styles.settingRowPressed,
                      ]}
                    >
                      <Text style={[styles.settingText, selected && styles.settingTextSelected]}>{item.label}</Text>
                      <View style={[styles.settingPip, selected && styles.settingPipSelected]} />
                    </Pressable>
                  );
                }}
              />
              <Pressable
                onPress={() => setTimezoneModalVisible(false)}
                style={({ pressed }) => [{ paddingVertical: 12, alignItems: "center" }, pressed && { opacity: 0.8 }]}
              >
                <Text style={{ color: "#8C8C8C", fontWeight: "700" }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={glowModalVisible} transparent animationType="fade" onRequestClose={() => setGlowModalVisible(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                maxHeight: "80%",
                width: "100%",
                borderRadius: 20,
                backgroundColor: "#060606",
                borderWidth: 1,
                borderColor: "#1D1D1D",
                paddingVertical: 10,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "800",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                Select glow preset
              </Text>
              <FlatList
                data={glowOptions}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => {
                  const selected = item.key === glowPresetKey;
                  return (
                    <Pressable
                      onPress={() => {
                        onChangeGlowPresetKey(item.key);
                        setGlowModalVisible(false);
                      }}
                      style={({ pressed }) => [
                        styles.settingRow,
                        styles.settingRowFirst,
                        selected && styles.settingRowSelected,
                        pressed && styles.settingRowPressed,
                      ]}
                    >
                      <Text style={[styles.settingText, selected && styles.settingTextSelected]}>{item.name}</Text>
                      <View style={[styles.settingPip, selected && styles.settingPipSelected]} />
                    </Pressable>
                  );
                }}
              />
              <Pressable
                onPress={() => setGlowModalVisible(false)}
                style={({ pressed }) => [{ paddingVertical: 12, alignItems: "center" }, pressed && { opacity: 0.8 }]}
              >
                <Text style={{ color: "#8C8C8C", fontWeight: "700" }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Text
          accessibilityRole="text"
          style={{
            position: "absolute",
            right: 14,
            bottom: 12,
            color: "#8C8C8C",
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 0.4,
          }}
        >
          v{appVersion}
        </Text>
      </View>
    </AnimatedGlow>
  );
}
