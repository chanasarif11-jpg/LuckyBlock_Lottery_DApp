
const themePresets = {
  midnight: { accent: "#d9ad5b", mode: "dark" },
  ocean: { accent: "#55b8e8", mode: "dark" },
  emerald: { accent: "#54c99a", mode: "dark" },
  rose: { accent: "#ed8eae", mode: "dark" },
  purple: { accent: "#aa91f2", mode: "dark" },
  light: { accent: "#b58a3d", mode: "light" }
};

function applyAccent(color) {
  document.documentElement.style.setProperty("--accent", color);

  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  document.documentElement.style.setProperty(
    "--accent-rgb",
    `${r},${g},${b}`
  );
}

function loadPreferences() {
  let saved = {};

  try {
    saved = JSON.parse(
      localStorage.getItem("luckyblockPreferences") || "{}"
    );
  } catch (_) {}

  const preset = themePresets[saved.theme] || themePresets.midnight;

  applyAccent(saved.accent || preset.accent);

  document.body.classList.toggle(
    "light",
    saved.mode ? saved.mode === "light" : preset.mode === "light"
  );

  document.body.classList.toggle(
    "compact",
    saved.spacing === "compact"
  );

  updateThemeControls(
    saved.theme || "midnight",
    saved.mode || preset.mode,
    saved.spacing || "comfortable",
    saved.accent || preset.accent
  );
}

function savePreferences(prefs) {
  localStorage.setItem(
    "luckyblockPreferences",
    JSON.stringify(prefs)
  );
}

function currentPreferences() {
  let p = {};

  try {
    p = JSON.parse(
      localStorage.getItem("luckyblockPreferences") || "{}"
    );
  } catch (_) {}

  return {
    theme: p.theme || "midnight",
    mode: p.mode || "dark",
    spacing: p.spacing || "comfortable",
    accent: p.accent || "#d9ad5b"
  };
}

function updateThemeControls(theme, mode, spacing, accent) {
  document.querySelectorAll(".theme-option").forEach(button => {
    button.classList.toggle(
      "selected",
      button.dataset.theme === theme
    );
  });

  document.getElementById("accentPicker").value = accent;

  document.getElementById("darkMode").classList.toggle(
    "selected",
    mode === "dark"
  );

  document.getElementById("lightMode").classList.toggle(
    "selected",
    mode === "light"
  );

  document.getElementById("compactMode").classList.toggle(
    "selected",
    spacing === "compact"
  );

  document.getElementById("comfortableMode").classList.toggle(
    "selected",
    spacing === "comfortable"
  );
}

function updatePreference(changes) {
  const prefs = {
    ...currentPreferences(),
    ...changes
  };

  applyAccent(prefs.accent);

  document.body.classList.toggle(
    "light",
    prefs.mode === "light"
  );

  document.body.classList.toggle(
    "compact",
    prefs.spacing === "compact"
  );

  savePreferences(prefs);

  updateThemeControls(
    prefs.theme,
    prefs.mode,
    prefs.spacing,
    prefs.accent
  );
}

document.addEventListener("DOMContentLoaded", () => {
  loadPreferences();

  const modal = document.getElementById("settingsModal");

  document.getElementById("openSettings").addEventListener(
    "click",
    () => modal.classList.add("show")
  );

  document.getElementById("closeSettings").addEventListener(
    "click",
    () => modal.classList.remove("show")
  );

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      modal.classList.remove("show");
    }
  });

  document.getElementById("themeToggle").addEventListener(
    "click",
    () => {
      updatePreference({
        mode: document.body.classList.contains("light")
          ? "dark"
          : "light"
      });
    }
  );

  document.querySelectorAll(".theme-option").forEach(button => {
    button.addEventListener("click", () => {
      const preset = themePresets[button.dataset.theme];

      updatePreference({
        theme: button.dataset.theme,
        accent: preset.accent,
        mode: preset.mode
      });
    });
  });

  document.getElementById("accentPicker").addEventListener(
    "input",
    event => updatePreference({ accent: event.target.value })
  );

  document.getElementById("darkMode").addEventListener(
    "click",
    () => updatePreference({ mode: "dark" })
  );

  document.getElementById("lightMode").addEventListener(
    "click",
    () => updatePreference({ mode: "light" })
  );

  document.getElementById("compactMode").addEventListener(
    "click",
    () => updatePreference({ spacing: "compact" })
  );

  document.getElementById("comfortableMode").addEventListener(
    "click",
    () => updatePreference({ spacing: "comfortable" })
  );

  document.getElementById("resetSettings").addEventListener(
    "click",
    () => {
      localStorage.removeItem("luckyblockPreferences");
      loadPreferences();
    }
  );
});
