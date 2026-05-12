import { Blur, Canvas, Group, RoundedRect } from "@shopify/react-native-skia";
import React, { useState } from "react";
import { View } from "react-native";

export default function SkiaGlow({ preset = {}, style, children }) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };

  // Extract preset data from nested structure (states[0].preset)
  const presetData = preset.states?.[0]?.preset ?? preset;
  const glowLayers = (presetData.glowLayers && presetData.glowLayers.slice().reverse()) || [];
  const cornerRadius = presetData.cornerRadius ?? 12;

  // Calculate max glow size to adjust canvas
  const maxGlowSize = glowLayers.reduce((max, layer) => {
    const glowSize = layer.glowSize ?? 16;
    return Math.max(max, glowSize);
  }, 0);

  const canvasSize = {
    width: size.width + maxGlowSize * 2,
    height: size.height + maxGlowSize * 2,
  };

  return (
    <View style={[{ position: "relative" }, style]} onLayout={onLayout}>
      {size.width > 0 && size.height > 0 && glowLayers.length > 0 && (
        <Canvas
          pointerEvents="none"
          style={{
            position: "absolute",
            left: -maxGlowSize,
            top: -maxGlowSize,
            width: canvasSize.width,
            height: canvasSize.height,
          }}
        >
          {glowLayers.map((layer, i) => {
            const color = (layer.colors && layer.colors[0]) || "#FFFFFF";
            const opacity = typeof layer.opacity === "number" ? layer.opacity : 0.18;
            const glowSize = layer.glowSize ?? 16;

            if (opacity <= 0 || glowSize <= 0) return null;

            // Render a slightly larger rounded rect and blur it to create a soft glow.
            return (
              <Group key={i} opacity={opacity}>
                <RoundedRect
                  x={maxGlowSize - glowSize}
                  y={maxGlowSize - glowSize}
                  width={size.width + glowSize * 2}
                  height={size.height + glowSize * 2}
                  r={cornerRadius}
                  color={color}
                />
                <Blur blur={glowSize} />
              </Group>
            );
          })}
        </Canvas>
      )}

      <View style={{ position: "relative" }}>{children}</View>
    </View>
  );
}
