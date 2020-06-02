import React, { useState, useEffect } from "react";
import { ToggleSlider } from "../toggle-slider/toggle-slider.js";

import { TOKEN_PATH } from "../../auth.js";

import "./settings-menu.css";

const fs = window.require("fs");
const { remote } = window.require("electron");

const COLORS = ["default", "purple", "pink", "orange", "gold", "green", "teal"];

export function SettingsMenu({
  isSettingsMenuOpen,
  setIsSettingsMenuOpen,
  handleThemeChange,
  theme,
  shouldShowEventsWithVideoLinks,
  setShouldShowEventsWithVideoLinks,
  scheduleListRef,
  setIsWindowExpanded,
  isWindowExpanded,
}) {
  const [isConfirmSignOutVisible, setIsConfirmSignOutVisible] = useState(false);

  function currentEventsListHeight() {
    return (
      Array.from(scheduleListRef.current.children).reduce(
        (totalHeight, child) => totalHeight + Number(child.scrollHeight),
        0
      ) + 50
    );
  }

  function handleToggle() {
    localStorage.setItem(
      "shouldShowEventsWithoutVideoLinks",
      !shouldShowEventsWithVideoLinks
    );
    setShouldShowEventsWithVideoLinks(!shouldShowEventsWithVideoLinks);

    if (isWindowExpanded) {
      setTimeout(() => setIsWindowExpanded(true));
      setTimeout(() => window.resizeTo(400, currentEventsListHeight()), 50);
    }
  }

  function confirmSignOut() {
    fs.unlinkSync(TOKEN_PATH);
    // eslint-disable-next-line no-restricted-globals
    location.reload();
  }

  return (
    <div className={`settings-menu ${isSettingsMenuOpen ? "" : "hidden"}`}>
      {isSettingsMenuOpen && (
        <div className="settings-container">
          {isConfirmSignOutVisible ? (
            <>
              <div className="setting-container">
                <div className="settings-label">
                  Are you sure you want to sign out?
                </div>
              </div>
              <div className="settings-action-buttons-container">
                <div
                  className="link button-link sign-out-button"
                  onClick={() => confirmSignOut()}
                >
                  Yes
                </div>
                <div
                  className={`link button-link ${theme}`}
                  onClick={() => setIsConfirmSignOutVisible(false)}
                >
                  No
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="theme-list-container">
                <div className="version-label">
                  {"version: " + remote.app.getVersion()}
                </div>
                <div className="settings-label header">Theme:</div>
                <div className="theme-container ">
                  {COLORS.map((shade) => (
                    <div
                      key={shade}
                      className={`theme-circle ${shade}
                        ${theme === shade ? "active" : ""}`}
                      onClick={() => handleThemeChange(shade)}
                    />
                  ))}
                </div>
              </div>
              <div className="setting-container">
                <div className="settings-label">
                  Show events w/o video links:
                </div>
                <ToggleSlider
                  containerClassName={`toggle-video-links ${theme}`}
                  checked={shouldShowEventsWithVideoLinks}
                  onChange={handleToggle}
                />
              </div>
              <div className="settings-action-buttons-container">
                <div
                  className={`sign-out-button link button-link`}
                  onClick={() => setIsConfirmSignOutVisible(true)}
                >
                  {"Sign Out"}
                </div>
                <div
                  className={`link button-link ${theme}`}
                  onClick={() => setIsSettingsMenuOpen(false)}
                >
                  {"Close"}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
