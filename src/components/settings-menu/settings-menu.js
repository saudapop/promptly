import React, { useState, useEffect } from "react";
import { ToggleSlider } from "../toggle-slider/toggle-slider.js";
import { HEIGHT_OFFSET } from "../toolbar/toolbar.js";
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
  isWindowExpanded,
  adjustWindowPosition,
  appRef,
  shouldShowNextEventInTitleBar,
  setShowNextEventInTitleBar,
  isDarwin,
  isWin32,
}) {
  const [isConfirmSignOutVisible, setIsConfirmSignOutVisible] = useState(false);
  const [shouldLaunchOnSystemBoot, setShouldLaunchOnSystemBoot] = useState(
    JSON.parse(localStorage.getItem("shouldLaunchOnSystemBoot")) ||
      remote.app.getLoginItemSettings().openAtLogin
  );

  function currentEventsListHeight() {
    return Array.from(scheduleListRef.current.children).reduce(
      (totalHeight, child) => totalHeight + Number(child.scrollHeight),
      50
    );
  }

  function handleToggleShowVideoLinks() {
    localStorage.setItem(
      "shouldShowEventsWithoutVideoLinks",
      !shouldShowEventsWithVideoLinks
    );
    setShouldShowEventsWithVideoLinks(!shouldShowEventsWithVideoLinks);

    if (isWindowExpanded) {
      if (shouldShowEventsWithVideoLinks) {
        setTimeout(() => {
          appRef.current.style.height = currentEventsListHeight() + "px";
        });
        setTimeout(() => {
          window.resizeTo(400, currentEventsListHeight() + HEIGHT_OFFSET);
          adjustWindowPosition();
        }, 250);
      } else {
        setTimeout(() => {
          window.resizeTo(400, currentEventsListHeight() + HEIGHT_OFFSET);
          adjustWindowPosition();
        });
        setTimeout(() => {
          appRef.current.style.height = currentEventsListHeight() + "px";
        });
      }
    }
  }

  function handleToggleShowNextEventInTitleBar() {
    localStorage.setItem(
      "shouldShowNextEventInTitleBar",
      !shouldShowNextEventInTitleBar
    );
    setShowNextEventInTitleBar(!shouldShowNextEventInTitleBar);
  }

  function handleToggleShouldLaunchOnSystemBoot() {
    const newSetting = !remote.app.getLoginItemSettings().openAtLogin;

    localStorage.setItem("shouldLaunchOnSystemBoot", newSetting);
    setShouldLaunchOnSystemBoot(newSetting);
    remote.app.setLoginItemSettings({
      openAtLogin: newSetting,
    });
  }

  function confirmSignOut() {
    fs.unlinkSync(TOKEN_PATH);
    // eslint-disable-next-line no-restricted-globals
    location.reload();
  }

  useEffect(() => {
    if (JSON.parse(localStorage.getItem("shouldLaunchOnSystemBoot")) === null) {
      handleToggleShouldLaunchOnSystemBoot();
    }
  }, []);

  return (
    <div className={`settings-menu  ${isSettingsMenuOpen ? "" : "hidden"}`}>
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
              <div className={`settings-page-container ${theme}`}>
                <div className="theme-list-container">
                  <div className="settings-label">Theme:</div>
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
                    containerClassName={`setting-toggle ${theme}`}
                    checked={shouldShowEventsWithVideoLinks}
                    onChange={handleToggleShowVideoLinks}
                  />
                </div>
                {isDarwin && (
                  <div className="setting-container">
                    <div className="settings-label">
                      Show next event in title bar:
                    </div>
                    <ToggleSlider
                      containerClassName={`setting-toggle ${theme}`}
                      checked={shouldShowNextEventInTitleBar}
                      onChange={handleToggleShowNextEventInTitleBar}
                    />
                  </div>
                )}
                {(isDarwin || isWin32) && (
                  <div className="setting-container">
                    <div className="settings-label">Launch on system boot:</div>
                    <ToggleSlider
                      containerClassName={`setting-toggle ${theme}`}
                      checked={shouldLaunchOnSystemBoot}
                      onChange={handleToggleShouldLaunchOnSystemBoot}
                    />
                  </div>
                )}
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
      <div className="version-label">
        {"version: " + remote.app.getVersion()}
      </div>
    </div>
  );
}
