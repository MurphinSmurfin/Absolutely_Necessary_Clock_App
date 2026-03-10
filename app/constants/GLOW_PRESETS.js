export const GLOW_PRESETS = {
  off: {
    metadata: { name: "Off", textColor: "#FFFFFF", category: "Built-in", tags: ["static"] },
    states: [
      {
        name: "default",
        preset: {
          cornerRadius: 24,
          outlineWidth: 1,
          borderColor: "#1D1D1D",
          glowLayers: [{ colors: ["#000000"], opacity: 0, glowSize: 0 }],
        },
      },
    ],
  },
  arctic: {
    metadata: { name: "Arctic Blue", textColor: "#FFFFFF", category: "Built-in", tags: ["soft"] },
    states: [
      {
        name: "default",
        preset: {
          cornerRadius: 24,
          outlineWidth: 1,
          borderColor: "#1D1D1D",
          glowLayers: [{ colors: ["#35C5FF", "#A0E9FF"], opacity: 0.22, glowSize: 18 }],
        },
      },
    ],
  },
  pureWhite: {
    metadata: { name: "Pure White", textColor: "#FFFFFF", category: "Built-in", tags: ["dynamic"] },
    states: [
      {
        name: "default",
        preset: {
          cornerRadius: 24,
          outlineWidth: 1,
          borderColor: "white",
          animationSpeed: 0,
          glowLayers: [
            {
              colors: ["#FFFFFF"],
              opacity: 0.1,
              glowSize: 28,
              speedMultiplier: 0,
              glowPlacement: "behind",
            },
            {
              colors: ["#FFFFFF"],
              opacity: 0.3,
              glowSize: 6,
              speedMultiplier: 0,
              glowPlacement: "behind",
            },
          ],
        },
      },
    ],
  },
  violet: {
    metadata: { name: "Violet Glow", textColor: "#FFFFFF", category: "Built-in", tags: ["soft"] },
    states: [
      {
        name: "default",
        preset: {
          cornerRadius: 24,
          outlineWidth: 1,
          borderColor: "#1D1D1D",
          glowLayers: [{ colors: ["#AA6EFF", "#5B5BFF"], opacity: 0.2, glowSize: 18 }],
        },
      },
    ],
  },
};

export default GLOW_PRESETS;
