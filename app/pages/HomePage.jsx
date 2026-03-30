import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, AppState, Easing, Pressable, Text, useWindowDimensions, View } from "react-native";
import AnimatedGlow from "react-native-animated-glow";
import { GLOW_PRESETS } from "../constants/GLOW_PRESETS";
import { DEFAULT_TIMEZONE_KEY, TIMEZONE_MAP } from "../constants/TIMEZONES";

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatTime(date, timeFormat) {
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

function formatDateLabel(date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

function formatDayLabel(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
  });
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

function handStyle({ size, length, thickness, color }) {
  const left = (size - thickness) / 2;
  const top = size / 2 - length;

  return {
    position: "absolute",
    left,
    top,
    width: thickness,
    height: length,
    backgroundColor: color,
    borderRadius: thickness,
  };
}

function AnalogClock({ date, size, styles, syncNonce }) {
  const secondAngle = useRef(new Animated.Value(0)).current;

  const minutes = date.getMinutes() + date.getSeconds() / 60;
  const hours = (date.getHours() % 12) + minutes / 60;

  const minuteAngle = minutes * 6;
  const hourAngle = hours * 30;

  const facePadding = Math.round(size * 0.08);
  const radius = (size - facePadding * 2) / 2;
  const center = size / 2;

  const hourHandLength = Math.round(radius * 0.55);
  const minuteHandLength = Math.round(radius * 0.75);
  const secondHandLength = Math.round(radius * 0.85);

  useEffect(() => {
    const stopFlags = { second: false };
    let secondAnim = null;

    const startRotation = (animatedValue, { startAngle, msPerFullRotation, stopKey }) => {
      animatedValue.stopAnimation();
      animatedValue.setValue(startAngle);

      const remainingDegrees = 360 - startAngle;
      const remainingMs = Math.max(0, Math.round((remainingDegrees / 360) * msPerFullRotation));

      const runCycle = (toValue, duration) => {
        if (stopFlags[stopKey]) return;

        const safeDuration = Math.max(16, duration);
        const nextToValue = toValue;

        const maybeReset = nextToValue > 1000000;
        if (maybeReset) {
          const reduced = nextToValue % 360;
          animatedValue.setValue(reduced);
          return runCycle(reduced + 360, msPerFullRotation);
        }

        const anim = Animated.timing(animatedValue, {
          toValue: nextToValue,
          duration: safeDuration,
          easing: Easing.linear,
          useNativeDriver: true,
        });

        anim.start(({ finished }) => {
          if (!finished || stopFlags[stopKey]) return;
          runCycle(nextToValue + 360, msPerFullRotation);
        });

        return anim;
      };

      if (remainingMs === 0) {
        return runCycle(startAngle + 360, msPerFullRotation);
      }

      return runCycle(360, remainingMs);
    };

    const seed = new Date();
    const seconds = seed.getSeconds() + seed.getMilliseconds() / 1000;

    const secondStartAngle = (seconds * 6) % 360;

    secondAnim = startRotation(secondAngle, {
      startAngle: secondStartAngle,
      msPerFullRotation: 60_000,
      stopKey: "second",
    });

    return () => {
      stopFlags.second = true;
      secondAnim?.stop?.();
      secondAngle.stopAnimation();
    };
  }, [secondAngle, syncNonce]);

  const capSize = Math.round(size * 0.06);
  const capLeft = (size - capSize) / 2;
  const capTop = (size - capSize) / 2;

  const dotSize = Math.round(size * 0.02);
  const dotLeft = (size - dotSize) / 2;
  const dotTop = (size - dotSize) / 2;

  const ticks = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => {
      const isHour = i % 5 === 0;
      const tickHeight = isHour ? Math.round(size * 0.06) : Math.round(size * 0.03);
      const tickWidth = isHour ? Math.max(2, Math.round(size * 0.01)) : 1;
      const tickColor = isHour ? "#BDBDBD" : "#3A3A3A";

      return (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: center - tickWidth / 2,
            top: facePadding,
            width: tickWidth,
            height: tickHeight,
            backgroundColor: tickColor,
            borderRadius: tickWidth,
            transform: [{ translateY: radius - tickHeight / 2 }, { rotate: `${i * 6}deg` }, { translateY: -(radius - tickHeight / 2) }],
          }}
        />
      );
    });
  }, [center, facePadding, radius, size]);

  const secondRotate = useMemo(
    () =>
      secondAngle.interpolate({
        inputRange: [0, 360],
        outputRange: ["0deg", "360deg"],
      }),
    [secondAngle]
  );
  return (
    <View style={[styles.clockFace, { width: size, height: size }]}>
      {ticks}

      <View
        pointerEvents="none"
        style={[
          handStyle({
            size,
            length: hourHandLength,
            thickness: Math.max(4, Math.round(size * 0.02)),
            color: "#EDEDED",
          }),
          {
            transform: [{ translateY: hourHandLength / 2 }, { rotate: `${hourAngle}deg` }, { translateY: -hourHandLength / 2 }],
          },
        ]}
      />

      <View
        pointerEvents="none"
        style={[
          handStyle({
            size,
            length: minuteHandLength,
            thickness: Math.max(3, Math.round(size * 0.014)),
            color: "#D6D6D6",
          }),
          {
            transform: [{ translateY: minuteHandLength / 2 }, { rotate: `${minuteAngle}deg` }, { translateY: -minuteHandLength / 2 }],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          handStyle({
            size,
            length: secondHandLength,
            thickness: Math.max(2, Math.round(size * 0.008)),
            color: "#FF4D4D",
          }),
          {
            transform: [{ translateY: secondHandLength / 2 }, { rotate: secondRotate }, { translateY: -secondHandLength / 2 }],
          },
        ]}
      />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: capLeft,
          top: capTop,
          width: capSize,
          height: capSize,
          borderRadius: capSize / 2,
          backgroundColor: "#0E0E0E",
          borderWidth: 2,
          borderColor: "#2A2A2A",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: dotLeft,
          top: dotTop,
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: "#FF4D4D",
        }}
      />
    </View>
  );
}

function DigitalTime({ date, size, styles, timeFormat }) {
  const time = useMemo(() => formatTime(date, timeFormat), [date, timeFormat]);
  const fontSize = useMemo(() => {
    return Math.max(52, Math.round(size * 0.24));
  }, [size]);

  return (
    <View style={[styles.digitalTimeOnlyWrap, { width: size, height: size }]}>
      <Text style={[styles.digitalTimeOnly, { fontSize }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55} accessibilityRole="text">
        {time}
      </Text>
    </View>
  );
}

function DateDayPanel({ date, size = 240, align = "left", styles }) {
  const dateLabel = useMemo(() => formatDateLabel(date), [date]);
  const dayLabel = useMemo(() => formatDayLabel(date), [date]);

  const dateFontSize = useMemo(() => {
    return Math.max(26, Math.min(44, Math.round(size * 0.18)));
  }, [size]);
  const dayFontSize = useMemo(() => {
    return Math.max(18, Math.min(34, Math.round(size * 0.05)));
  }, [size]);

  return (
    <View style={[styles.datePanel, align === "center" ? styles.datePanelCenter : styles.datePanelLeft]}>
      <Text
        style={[
          styles.dateText,
          { fontSize: dateFontSize, lineHeight: Math.round(dateFontSize * 1.15) },
          align === "center" && styles.dateTextCenter,
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        accessibilityRole="text"
      >
        {dateLabel}
      </Text>
      <Text
        style={[styles.dayText, { fontSize: dayFontSize, lineHeight: Math.round(dayFontSize * 1.15) }, align === "center" && styles.dayTextCenter]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        accessibilityRole="text"
      >
        {dayLabel}
      </Text>
    </View>
  );
}

export default function HomePage({ glowPresetKey, styles, timeFormat = "24", timezoneKey = DEFAULT_TIMEZONE_KEY }) {
  const [now, setNow] = useState(() => new Date());
  // null = not yet loaded from storage
  const [showAnalog, setShowAnalog] = useState(null);
  //   const [glowState, setGlowState] = useState("default");
  const [analogSyncNonce, setAnalogSyncNonce] = useState(0);
  const timeoutRef = useRef(null);
  const isActiveRef = useRef(true);
  const { width, height } = useWindowDimensions();

  const displayDate = useMemo(() => getDisplayDate(now, timezoneKey), [now, timezoneKey]);

  useEffect(() => {
    let mounted = true;

    const clearTick = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const scheduleNext = () => {
      clearTick();
      if (!mounted || !isActiveRef.current) return;

      const delay = 1000 - (Date.now() % 1000);
      timeoutRef.current = setTimeout(() => {
        if (!mounted || !isActiveRef.current) return;
        setNow(new Date());
        scheduleNext();
      }, delay);
    };

    // Immediate sync + boundary-aligned updates.
    setNow(new Date());
    scheduleNext();

    const sub = AppState.addEventListener("change", (nextState) => {
      const active = nextState === "active";
      isActiveRef.current = active;
      if (active) {
        setNow(new Date());
        setAnalogSyncNonce((v) => v + 1);
        scheduleNext();
      } else {
        clearTick();
      }
    });

    // Force refresh animation every 5 minutes to prevent drift
    const syncInterval = setInterval(() => {
      if (mounted && isActiveRef.current) {
        setAnalogSyncNonce((v) => v + 1);
        console.log(`🔄 Forced sync to prevent drift ${new Date().toISOString()}`);
      }
    }, 300_000);

    return () => {
      mounted = false;
      clearTick();
      sub.remove();
      clearInterval(syncInterval);
    };
  }, []);

  useEffect(() => {
    const loadClockMode = async () => {
      try {
        const stored = await AsyncStorage.getItem("clockMode");
        if (stored === "analog" || stored === "digital") {
          setShowAnalog(stored === "analog");
        } else {
          // Default to analog when nothing stored yet
          setShowAnalog(true);
        }
      } catch (error) {
        console.error("Error loading clock mode:", error);
      }
    };
    loadClockMode();
  }, []);

  const layout = useMemo(() => {
    const containerWidth = Math.max(260, Math.round(width * 0.8));
    const containerHeight = Math.max(260, Math.round(height * 0.75));

    const contentPadding = 18;
    const contentWidth = Math.max(0, containerWidth - contentPadding * 2);
    const contentHeight = Math.max(0, containerHeight - contentPadding * 2);

    const leftPaneWidth = Math.round(contentWidth * 0.4);
    const panePadding = 14;
    const maxClockByWidth = Math.max(120, leftPaneWidth - panePadding * 2);
    const maxClockByHeight = Math.max(140, contentHeight - panePadding * 2);
    const clockSize = Math.min(maxClockByWidth, maxClockByHeight);

    return { clockSize, containerWidth, containerHeight, contentPadding };
  }, [width, height]);

  const toggle = () => {
    setShowAnalog((prev) => {
      const next = !prev;
      if (next) setAnalogSyncNonce((v) => v + 1);
      AsyncStorage.setItem("clockMode", next ? "analog" : "digital").catch((error) => {
        console.error("Error saving clock mode:", error);
      });
      return next;
    });
  };

  const activePreset = GLOW_PRESETS[glowPresetKey] ?? GLOW_PRESETS.off;

  return (
    <AnimatedGlow preset={activePreset}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          styles.clockPressable,
          { padding: layout.contentPadding },
          { width: layout.containerWidth },
          { height: layout.containerHeight },
          pressed && styles.clockPressablePressed,
        ]}
      >
        <View style={styles.splitRow}>
          <View style={styles.leftPane}>
            {showAnalog == null ? null : showAnalog ? (
              <AnalogClock date={displayDate} size={layout.clockSize} styles={styles} syncNonce={analogSyncNonce} />
            ) : (
              <DigitalTime date={displayDate} size={layout.clockSize} styles={styles} timeFormat={timeFormat} />
            )}
          </View>

          <View style={styles.splitDividerWrap} pointerEvents="none">
            <View style={styles.splitDivider} />
            <View style={styles.splitDot} />
          </View>

          <View style={styles.rightPane}>
            <DateDayPanel date={displayDate} size={layout.clockSize} align="left" styles={styles} />
          </View>
        </View>
      </Pressable>
    </AnimatedGlow>
  );
}
