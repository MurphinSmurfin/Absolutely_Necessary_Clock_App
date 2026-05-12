import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
// Animated glow removed to avoid runtime crashes
import SkiaGlow from "../components/SkiaGlow";
import { BODY_VARIANTS } from "../constants/BODY_VARIANTS";
import { GLOW_PRESETS } from "../constants/GLOW_PRESETS";

export default function AboutPage({ styles, glowPresetKey }) {
  const { width, height } = useWindowDimensions();
  const [body, setBody] = useState(BODY_VARIANTS[Math.floor(Math.random() * BODY_VARIANTS.length)]);

  const activePreset = GLOW_PRESETS[glowPresetKey] ?? GLOW_PRESETS.off;

  const layout = useMemo(() => {
    const containerWidth = Math.max(260, Math.round(width * 0.8));
    const containerHeight = Math.max(260, Math.round(height * 0.75));
    return { containerWidth, containerHeight };
  }, [width, height]);
  useFocusEffect(
    useCallback(() => {
      setBody(BODY_VARIANTS[Math.floor(Math.random() * BODY_VARIANTS.length)]);
    }, [])
  );

  return (
    <SkiaGlow preset={activePreset} style={{ width: layout.containerWidth, height: layout.containerHeight }}>
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
        <View style={aboutStyles.fill}>
          <View style={aboutStyles.top}>
            <Text style={styles.pageTitle}>About</Text>

            <Text style={styles.pageBody}>
              Welcome to the Absolutely Necessary Clock App — a dark-mode-only timepiece for people who need to know the time with dramatic precision.
            </Text>

            <Text style={styles.pageBodyMuted}>{body.intro}</Text>

            <Text style={styles.pageBodyMuted}>
              {body.listIntro}
              {"\n"}• {body.bullets[0]}
              {"\n"}• {body.bullets[1]}
              {"\n"}• {body.bullets[2]}
            </Text>

            <Text style={styles.pageBodyMuted}>{body.closing}</Text>

            <Text style={styles.pageBodyMuted}>{body.disclaimer}</Text>
          </View>

          <View style={aboutStyles.socialRow}>
            <View style={aboutStyles.socialItem}>
              <FontAwesome name="hashtag" size={18} color="#D6D6D6" />
              <Text style={aboutStyles.socialText}>absolutelynecessaryclockapp</Text>
            </View>
            <View style={aboutStyles.socialItem}>
              <FontAwesome name="github" size={18} color="#D6D6D6" />
              <Text style={aboutStyles.socialText}>@MurphinSmurfin</Text>
            </View>
            <View style={aboutStyles.socialItem}>
              <FontAwesome name="instagram" size={18} color="#D6D6D6" />
              <Text style={aboutStyles.socialText}>@bitsofmurph</Text>
            </View>
          </View>
        </View>
      </View>
    </SkiaGlow>
  );
}

const aboutStyles = StyleSheet.create({
  fill: {
    flex: 1,
    justifyContent: "space-between",
    gap: 14,
  },
  top: {
    gap: 12,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#141414",
  },
  socialItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  socialText: {
    color: "#D6D6D6",
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
