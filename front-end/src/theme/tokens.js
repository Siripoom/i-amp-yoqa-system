// Brand values live here; CSS, Ant Design and charts consume the same palette.
export const colors = Object.freeze({
  primary: "#492F2A",
  "primary-dark": "#22100C",
  accent: "#D18961",
  background: "#FDFAF9",
  surface: "#F7E7E0",
  border: "#CCAD9F",
  text: "#22100C",
  muted: "#8C746B",
  secondary: "#745E55",
  white: "#FFFFFF",
  success: "#526947",
  warning: "#886322",
  error: "#A34438",
  info: "#5D6872",
});

export function rgb(hex) {
  return hex.replace("#", "").match(/../g).map(value => parseInt(value, 16));
}

export function tint(hex, amount = 0.1) {
  return `#${rgb(hex).map(value => Math.round(value * amount + 255 * (1 - amount)).toString(16).padStart(2, "0")).join("")}`;
}

export const statusBackgrounds = Object.fromEntries(
  ["success", "warning", "error", "info"].map(name => [name, tint(colors[name])]),
);
export const chartColors = [colors.primary, colors.accent, colors.success, colors.warning, colors.error, colors.info];

export function contrastRatio(a, b) {
  const luminance = hex => rgb(hex).map(value => value / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// Data colors are not rewritten. Normalize old values with/without '#' for display.
export function eventStyle(value) {
  let hex = typeof value === "string" ? value.replace(/^#/, "") : "";
  if (/^[a-f\d]{3}$/i.test(hex)) hex = hex.split("").map(char => char + char).join("");
  const backgroundColor = /^[a-f\d]{6}$/i.test(hex) ? `#${hex}` : colors.accent;
  const color = contrastRatio(backgroundColor, colors.text) >= contrastRatio(backgroundColor, colors.white) ? colors.text : colors.white;
  return { backgroundColor, color };
}

export function installThemeVariables(root = document.documentElement) {
  for (const [name, value] of Object.entries(colors)) {
    root.style.setProperty(`--color-${name}`, value);
    root.style.setProperty(`--color-${name}-rgb`, rgb(value).join(" "));
  }
  root.style.setProperty("--color-text-muted", colors.muted);
  for (const [name, value] of Object.entries(statusBackgrounds)) {
    root.style.setProperty(`--color-${name}-soft`, value);
    root.style.setProperty(`--color-${name}-soft-rgb`, rgb(value).join(" "));
  }
  root.style.setProperty("--shadow-card", "0 4px 20px rgba(73,47,42,0.08)");
  root.style.setProperty("--shadow-hover", "0 8px 28px rgba(73,47,42,0.12)");
  root.style.setProperty("--radius-control", "12px");
  root.style.setProperty("--radius-card", "16px");
}

export const wellnessTheme = {
  token: {
    colorPrimary: colors.primary,
    colorPrimaryHover: colors["primary-dark"],
    colorPrimaryActive: colors["primary-dark"],
    colorLink: colors.primary,
    colorLinkHover: colors["primary-dark"],
    colorLinkActive: colors["primary-dark"],
    colorText: colors.text,
    colorTextHeading: colors["primary-dark"],
    colorTextSecondary: colors.secondary,
    colorTextTertiary: colors.secondary,
    colorTextQuaternary: colors.secondary,
    colorTextPlaceholder: colors.secondary,
    colorTextDisabled: colors.muted,
    colorTextLightSolid: colors.white,
    colorBgBase: colors.background,
    colorBgLayout: colors.background,
    colorBgContainer: colors.white,
    colorBgElevated: colors.white,
    colorBgContainerDisabled: colors.surface,
    colorBorder: colors.secondary,
    colorBorderSecondary: colors.border,
    colorSplit: colors.border,
    colorFillAlter: colors.surface,
    colorBgMask: "rgba(34,16,12,0.45)",
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorInfo: colors.info,
    ...Object.fromEntries(Object.entries(statusBackgrounds).map(([name, value]) => [`color${name[0].toUpperCase() + name.slice(1)}Bg`, value])),
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    boxShadow: "0 4px 20px rgba(73,47,42,0.08)",
    boxShadowSecondary: "0 8px 28px rgba(73,47,42,0.12)",
    fontFamily: '"Mali", cursive',
  },
  components: {
    Layout: { bodyBg: colors.background, headerBg: colors.background, siderBg: colors.background },
    Menu: { itemBg: colors.background, itemSelectedBg: colors.primary, itemSelectedColor: colors.white, itemHoverBg: colors.surface, itemHoverColor: colors.primary },
    Button: { primaryShadow: "none", defaultShadow: "none", dangerShadow: "none", defaultBorderColor: colors.secondary },
    Card: { headerBg: colors.surface },
    Table: { headerBg: colors.surface, headerColor: colors.text, rowHoverBg: colors.background, rowSelectedBg: colors.surface, rowSelectedHoverBg: colors.surface, borderColor: colors.border },
    Tabs: { itemColor: colors.secondary, itemSelectedColor: colors.primary, itemHoverColor: colors["primary-dark"], inkBarColor: colors.accent },
    Tooltip: { colorBgSpotlight: colors.primary },
    Calendar: { itemActiveBg: colors.surface },
  },
};
