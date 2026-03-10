import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import AnimatedGlow from "react-native-animated-glow";
import { GLOW_PRESETS } from "../constants/GLOW_PRESETS";
import { DEFAULT_TIMEZONE_KEY, TIMEZONE_MAP } from "../constants/TIMEZONES";

const STORAGE_KEY = "clockInOutRecord";
const PERSON_COUNT = 3;
const PERSON_LABELS = ["Murph", "Desmond", "Eric"];

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatTimeWithSeconds(date, timeFormat) {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  if (timeFormat === "12") {
    const period = hours24 >= 12 ? "PM" : "AM";
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;
    return `${pad2(hours12)}:${pad2(minutes)}:${pad2(seconds)} ${period}`;
  }

  return `${pad2(hours24)}:${pad2(minutes)}:${pad2(seconds)}`;
}

function getDisplayDate(baseDate, timezoneKey) {
  const tz = TIMEZONE_MAP[timezoneKey] ?? TIMEZONE_MAP[DEFAULT_TIMEZONE_KEY];

  if (!tz || tz.offsetMinutes == null) {
    return baseDate;
  }

  const utcTimestamp = baseDate.getTime() + baseDate.getTimezoneOffset() * 60 * 1000;
  const zonedTimestamp = utcTimestamp + tz.offsetMinutes * 60 * 1000;

  return new Date(zonedTimestamp);
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
}

export default function ClockInPage({ glowPresetKey, styles, timeFormat = "24", timezoneKey = DEFAULT_TIMEZONE_KEY, onMidnightReset }) {
  const { width, height } = useWindowDimensions();
  const [recordsByPerson, setRecordsByPerson] = useState(Array(PERSON_COUNT).fill(null));
  const [activePersonIndex, setActivePersonIndex] = useState(null);
  const [hasLoadedRecord, setHasLoadedRecord] = useState(false);
  const resetTimeoutRef = useRef(null);
  const clockInOverrideCountRef = useRef(0);
  const clockInOverrideTimerRef = useRef(null);
  const autoClockInDoneRef = useRef(Array(PERSON_COUNT).fill(false));
  const [clockInOverrideStage, setClockInOverrideStage] = useState(0);
  const [showClockInTimePicker, setShowClockInTimePicker] = useState(false);
  const [overrideHour, setOverrideHour] = useState(9);
  const [overrideMinute, setOverrideMinute] = useState(0);

  const record = activePersonIndex == null ? null : (recordsByPerson[activePersonIndex] ?? null);

  const layout = useMemo(() => {
    const containerWidth = Math.max(260, Math.round(width * 0.8));
    const containerHeight = Math.max(260, Math.round(height * 0.75));
    return { containerWidth, containerHeight };
  }, [width, height]);

  const activePreset = GLOW_PRESETS[glowPresetKey] ?? GLOW_PRESETS.off;

  useEffect(() => {
    const loadRecord = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setRecordsByPerson(Array(PERSON_COUNT).fill(null));
          setHasLoadedRecord(true);
          return;
        }
        const todayKey = getLocalDateKey(new Date());
        const parsed = JSON.parse(raw);

        let initialRecords = Array(PERSON_COUNT).fill(null);

        if (parsed && Array.isArray(parsed.records)) {
          // New multi-person shape (we no longer restore last selected person index)
          initialRecords = parsed.records.map((entry) => {
            if (!entry || entry.dateKey !== todayKey) return null;
            return {
              dateKey: entry.dateKey,
              clockIn: entry.clockIn ? new Date(entry.clockIn) : null,
              clockOut: entry.clockOut ? new Date(entry.clockOut) : null,
            };
          });
        } else if (parsed && parsed.dateKey) {
          // Legacy single-person shape
          if (parsed.dateKey === todayKey) {
            initialRecords[0] = {
              dateKey: parsed.dateKey,
              clockIn: parsed.clockIn ? new Date(parsed.clockIn) : null,
              clockOut: parsed.clockOut ? new Date(parsed.clockOut) : null,
            };
          }
        }

        setRecordsByPerson(initialRecords);
        setHasLoadedRecord(true);
      } catch (error) {
        console.error("Error loading clock-in record:", error);
        setRecordsByPerson(Array(PERSON_COUNT).fill(null));
        setHasLoadedRecord(true);
      }
    };

    loadRecord();
  }, []);

  useEffect(() => {
    const clearScheduled = () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
    };

    const scheduleMidnightReset = () => {
      clearScheduled();
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const delay = Math.max(1000, tomorrow.getTime() - now.getTime());

      resetTimeoutRef.current = setTimeout(async () => {
        try {
          await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (error) {
          console.error("Error clearing clock-in record at midnight:", error);
        }
        setRecordsByPerson(Array(PERSON_COUNT).fill(null));
        if (typeof onMidnightReset === "function") {
          onMidnightReset();
        }
        scheduleMidnightReset();
      }, delay);
    };

    scheduleMidnightReset();

    return () => {
      clearScheduled();
    };
  }, [onMidnightReset]);

  useEffect(() => {
    return () => {
      if (clockInOverrideTimerRef.current) {
        clearTimeout(clockInOverrideTimerRef.current);
        clockInOverrideTimerRef.current = null;
      }
    };
  }, []);
  useEffect(() => {
    // Reset override state when switching between people
    clockInOverrideCountRef.current = 0;
    setClockInOverrideStage(0);

    if (clockInOverrideTimerRef.current) {
      clearTimeout(clockInOverrideTimerRef.current);
      clockInOverrideTimerRef.current = null;
    }
  }, [activePersonIndex]);

  useEffect(() => {
    if (!hasLoadedRecord) return;
    if (activePersonIndex == null) return;
    const todayKey = getLocalDateKey(new Date());
    const doneForPerson = autoClockInDoneRef.current[activePersonIndex];
    if (doneForPerson) return;

    const currentRecord = recordsByPerson[activePersonIndex] ?? null;
    if (!currentRecord || currentRecord.dateKey !== todayKey || !currentRecord.clockIn) {
      const now = new Date();
      const next = {
        dateKey: todayKey,
        clockIn: now,
        clockOut: null,
      };
      autoClockInDoneRef.current[activePersonIndex] = true;
      setRecordsByPerson((prev) => {
        const updated = [...prev];
        updated[activePersonIndex] = next;
        return updated;
      });
    }
  }, [recordsByPerson, hasLoadedRecord, activePersonIndex]);

  const saveRecordForPerson = (personIndex, next) => {
    setRecordsByPerson((prev) => {
      const updated = [...prev];
      updated[personIndex] = next;
      return updated;
    });
  };

  useEffect(() => {
    if (!hasLoadedRecord) return;

    const allEmpty = recordsByPerson.every((entry) => !entry);
    if (allEmpty) {
      AsyncStorage.removeItem(STORAGE_KEY).catch((error) => {
        console.error("Error clearing clock-in records:", error);
      });
      return;
    }

    const payload = {
      records: recordsByPerson.map((entry) =>
        entry
          ? {
              dateKey: entry.dateKey,
              clockIn: entry.clockIn ? entry.clockIn.toISOString() : null,
              clockOut: entry.clockOut ? entry.clockOut.toISOString() : null,
            }
          : null
      ),
    };

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch((error) => {
      console.error("Error saving clock-in records:", error);
    });
  }, [recordsByPerson, hasLoadedRecord]);

  const handleClockIn = () => {
    if (activePersonIndex == null) return;
    const now = new Date();
    const dateKey = getLocalDateKey(now);
    const next = {
      dateKey,
      clockIn: now,
      clockOut: record && record.dateKey === dateKey ? record.clockOut : null,
    };
    saveRecordForPerson(activePersonIndex, next);
  };

  const handleClockInPress = () => {
    if (activePersonIndex == null) {
      return;
    }
    if (!hasExistingTodayClockIn) {
      handleClockIn();
      setClockInOverrideStage(0);
      return;
    }

    const nextCount = clockInOverrideCountRef.current + 1;
    if (nextCount >= 5) {
      clockInOverrideCountRef.current = 0;
      if (clockInOverrideTimerRef.current) {
        clearTimeout(clockInOverrideTimerRef.current);
        clockInOverrideTimerRef.current = null;
      }
      setClockInOverrideStage(0);

      // Open custom time selector for override instead of using current time
      const base = new Date();
      setOverrideHour(base.getHours());
      setOverrideMinute(base.getMinutes());
      setShowClockInTimePicker(true);
    } else {
      clockInOverrideCountRef.current = nextCount;
      if (clockInOverrideTimerRef.current) {
        clearTimeout(clockInOverrideTimerRef.current);
      }
      clockInOverrideTimerRef.current = setTimeout(() => {
        clockInOverrideCountRef.current = 0;
        clockInOverrideTimerRef.current = null;
        setClockInOverrideStage(0);
      }, 5000);

      if (nextCount === 4) {
        setClockInOverrideStage(1);
      }
    }
  };

  const applyCustomClockIn = () => {
    if (!record) {
      // Fallback: if somehow no record, just use normal clock-in
      handleClockIn();
      setShowClockInTimePicker(false);
      return;
    }

    const [year, month, day] = record.dateKey.split("-").map((v) => parseInt(v, 10));
    const custom = new Date();
    custom.setFullYear(year, month - 1, day);
    custom.setHours(overrideHour, overrideMinute, 0, 0);

    const next = {
      dateKey: record.dateKey,
      clockIn: custom,
      clockOut: record.clockOut ?? null,
    };

    saveRecordForPerson(activePersonIndex, next);
    setShowClockInTimePicker(false);
  };

  const displayClockIn = useMemo(() => {
    if (!record?.clockIn) return null;
    const zoned = getDisplayDate(record.clockIn, timezoneKey);
    return formatTimeWithSeconds(zoned, timeFormat);
  }, [record, timezoneKey, timeFormat]);

  const expectedHalfDay = useMemo(() => {
    if (!record?.clockIn) return null;
    const base = new Date(record.clockIn.getTime() + 4.5 * 60 * 60 * 1000);
    const minHalf = new Date(record.clockIn);
    minHalf.setHours(13, 0, 0, 0); // 1:00 PM local time
    const effective = base < minHalf ? minHalf : base;
    const zoned = getDisplayDate(effective, timezoneKey);
    return formatTimeWithSeconds(zoned, timeFormat);
  }, [record, timezoneKey, timeFormat]);

  const expectedFullDay = useMemo(() => {
    if (!record?.clockIn) return null;
    const base = new Date(record.clockIn.getTime() + 9.5 * 60 * 60 * 1000);
    const minFull = new Date(record.clockIn);
    minFull.setHours(18, 0, 0, 0); // 6:00 PM local time
    const effective = base < minFull ? minFull : base;
    const zoned = getDisplayDate(effective, timezoneKey);
    return formatTimeWithSeconds(zoned, timeFormat);
  }, [record, timezoneKey, timeFormat]);

  const hasExistingTodayClockIn = useMemo(() => {
    if (!record?.clockIn) return false;
    const todayKey = getLocalDateKey(new Date());
    return record.dateKey === todayKey;
  }, [record]);

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
            justifyContent: "space-between",
            paddingVertical: 22,
          },
        ]}
      >
        <View>
          <Text style={styles.pageTitle}>Clock In</Text>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            {Array.from({ length: PERSON_COUNT }).map((_, index) => {
              const isActive = index === activePersonIndex;
              return (
                <Pressable
                  key={index}
                  onPress={() => setActivePersonIndex(index)}
                  style={({ pressed }) => [
                    styles.navBtn,
                    { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: "#2A2A2A", backgroundColor: "#050505" },
                    isActive && styles.navBtnActive,
                    pressed && styles.navBtnPressed,
                  ]}
                >
                  <Text style={isActive ? styles.navBtnTextActive : styles.navBtnText}>{PERSON_LABELS[index] ?? `Person ${index + 1}`}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Pressable
              onPress={handleClockInPress}
              style={({ pressed }) => [
                styles.navBtn,
                styles.navBtnActive,
                { flex: 1, paddingVertical: 12 },
                hasExistingTodayClockIn &&
                  clockInOverrideStage === 1 && {
                    backgroundColor: "#7A1515",
                    borderColor: "#FF4D4D",
                  },
                pressed && styles.navBtnPressed,
              ]}
            >
              <Text style={styles.navBtnTextActive}>
                {hasExistingTodayClockIn && clockInOverrideStage === 1 ? "Are you sure you want to override?" : "Clock In"}
              </Text>
            </Pressable>
          </View>

          {hasExistingTodayClockIn ? (
            <Text
              style={{
                marginTop: 6,
                color: "#6A6A6A",
                fontSize: 11,
              }}
            >
              Tap Clock In 5 times quickly to override today&apos;s clock-in time.
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text style={styles.pageBodyMuted}>Clock in time (today)</Text>
            <Text style={styles.pageBody}>{displayClockIn ?? "Not clocked in yet"}</Text>
          </View>

          <View />

          <View>
            <Text style={styles.pageBodyMuted}>Expected half day</Text>
            <Text style={styles.pageBody}>{expectedHalfDay ?? "--"}</Text>
          </View>

          <View>
            <Text style={styles.pageBodyMuted}>Expected full day</Text>
            <Text style={styles.pageBody}>{expectedFullDay ?? "--"}</Text>
          </View>
        </View>

        {showClockInTimePicker && (
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.75)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#050505",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#2A2A2A",
                width: Math.min(layout.containerWidth - 40, 340),
                gap: 12,
              }}
            >
              <Text style={styles.pageBody}>Set new clock-in time</Text>

              <View style={{ alignItems: "center", marginTop: 4 }}>
                <Text style={styles.pageBody}>
                  {pad2(overrideHour)}:{pad2(overrideMinute)}
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={styles.pageBodyMuted}>Hour</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 }}>
                    <Pressable
                      onPress={() => setOverrideHour((prev) => (prev + 23) % 24)}
                      style={({ pressed }) => [styles.navBtn, { paddingHorizontal: 10, paddingVertical: 4 }, pressed && styles.navBtnPressed]}
                    >
                      <Text style={styles.navBtnText}>-</Text>
                    </Pressable>
                    <Text style={styles.pageBody}>{pad2(overrideHour)}</Text>
                    <Pressable
                      onPress={() => setOverrideHour((prev) => (prev + 1) % 24)}
                      style={({ pressed }) => [styles.navBtn, { paddingHorizontal: 10, paddingVertical: 4 }, pressed && styles.navBtnPressed]}
                    >
                      <Text style={styles.navBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={styles.pageBodyMuted}>Minute</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 }}>
                    <Pressable
                      onPress={() => setOverrideMinute((prev) => (prev + 59) % 60)}
                      style={({ pressed }) => [styles.navBtn, { paddingHorizontal: 10, paddingVertical: 4 }, pressed && styles.navBtnPressed]}
                    >
                      <Text style={styles.navBtnText}>-</Text>
                    </Pressable>
                    <Text style={styles.pageBody}>{pad2(overrideMinute)}</Text>
                    <Pressable
                      onPress={() => setOverrideMinute((prev) => (prev + 1) % 60)}
                      style={({ pressed }) => [styles.navBtn, { paddingHorizontal: 10, paddingVertical: 4 }, pressed && styles.navBtnPressed]}
                    >
                      <Text style={styles.navBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12, gap: 10 }}>
                <Pressable
                  onPress={() => setShowClockInTimePicker(false)}
                  style={({ pressed }) => [
                    styles.navBtn,
                    { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#2A2A2A", backgroundColor: "#050505" },
                    pressed && styles.navBtnPressed,
                  ]}
                >
                  <Text style={styles.navBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={applyCustomClockIn}
                  style={({ pressed }) => [
                    styles.navBtn,
                    styles.navBtnActive,
                    { paddingHorizontal: 14, paddingVertical: 8 },
                    pressed && styles.navBtnPressed,
                  ]}
                >
                  <Text style={styles.navBtnTextActive}>Set time</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </AnimatedGlow>
  );
}
