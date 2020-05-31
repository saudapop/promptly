import React from "react";
import { ToggleSlider } from "../toggle-slider/toggle-slider.js";

import "./settings-menu.css";

const COLORS = [
  "default",
  "purple",
  "salmon",
  "orange",
  "sienna",
  "green",
  "teal",
];

export function SettingsMenu({
  isSettingsMenuOpen,
  setIsSettingsMenuOpen,
  handleThemeChange,
  theme,
  shouldShowEventsWithVideoLinks,
  setShouldShowEventsWithVideoLinks,
}) {
  function handleToggle() {
    localStorage.setItem(
      "shouldShowEventsWithoutVideoLinks",
      !shouldShowEventsWithVideoLinks
    );
    setShouldShowEventsWithVideoLinks(!shouldShowEventsWithVideoLinks);
  }

  return (
    <div className={`settings-menu ${isSettingsMenuOpen ? "" : "hidden"}`}>
      <div className="settings-container">
        <div className="theme-list-container">
          <div className="settings-label">Theme:</div>
          <div className="theme-container ">
            {COLORS.map((shade) => (
              <div
                key={shade}
                className={`theme-circle ${shade}`}
                onClick={() => handleThemeChange(shade)}
              />
            ))}
          </div>
        </div>
        <div className="setting-container">
          <div className="settings-label">Show events w/o video links:</div>
          <ToggleSlider
            containerClassName={`toggle-video-links ${theme}`}
            checked={shouldShowEventsWithVideoLinks}
            onChange={handleToggle}
          />
        </div>
        <div className="settings-action-buttons-container">
          <div
            className={`link button-link ${theme}`}
            onClick={() => setIsSettingsMenuOpen(false)}
          >
            {"Close"}
          </div>
          <div className={`sign-out-button link button-link`}>{"Sign Out"}</div>
        </div>
      </div>
    </div>
  );
}
