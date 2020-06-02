import React from "react";
import { ReactComponent as ShrinkIcon } from "./compress-alt-solid.svg";
import { ReactComponent as ExpandIcon } from "./expand-solid.svg";
import { ReactComponent as RefreshIcon } from "./refresh.svg";
import { ReactComponent as CloseIcon } from "./times-solid.svg";
import { ReactComponent as PinIcon } from "./thumbtack-solid.svg";
import { ReactComponent as SettingsIcon } from "./gear.svg";

import "./toolbar.css";

const { remote } = window.require("electron");

const WINDOW_HEIGHT = 400;
const WINDOW_WIDTH = 100;

const FONT_AWESOME_LICENSE = "https://fontawesome.com/license";

export function Toolbar({
  scheduleListRef,
  refetchSchedule,
  isWindowPinned,
  setIsWindowPinned,
  isWindowExpanded,
  setIsWindowExpanded,
  isSettingsMenuOpen,
  setIsSettingsMenuOpen,
}) {
  function handleExpandToggle() {
    if (isWindowExpanded) {
      setIsWindowExpanded(!isWindowExpanded);
      setTimeout(() => window.resizeTo(WINDOW_HEIGHT, WINDOW_WIDTH), 250);
    } else {
      setTimeout(() => setIsWindowExpanded(!isWindowExpanded), 0);
      window.resizeTo(
        400,
        window.outerHeight + scheduleListRef.current.scrollHeight
      );
    }
  }

  return (
    <div className="list-options-container">
      <div className="icon-container left">
        <SettingsIcon
          className={`gear-icon option-icon`}
          alt={"https://www.flaticon.com/authors/those-icons"}
          onClick={() => {
            setIsSettingsMenuOpen(!isSettingsMenuOpen);
          }}
        />
      </div>
      <div className="icon-container">
        <ShrinkIcon
          className={`shrink-icon option-icon ${
            isWindowExpanded ? "" : "hidden"
          }`}
          alt={FONT_AWESOME_LICENSE}
          onClick={handleExpandToggle}
        />
        <ExpandIcon
          className={`expand-icon option-icon ${
            isWindowExpanded ? "hidden" : ""
          }`}
          alt={FONT_AWESOME_LICENSE}
          onClick={handleExpandToggle}
        />
      </div>
      <div className="icon-container right">
        <RefreshIcon
          className="action-icon option-icon"
          alt={FONT_AWESOME_LICENSE}
          onClick={refetchSchedule}
        />
        <PinIcon
          className={`action-icon option-icon pin-icon ${
            isWindowPinned ? "pinned" : ""
          }`}
          alt={FONT_AWESOME_LICENSE}
          onClick={() => {
            remote.getCurrentWindow().setAlwaysOnTop(!isWindowPinned);
            setIsWindowPinned(!isWindowPinned);
          }}
        />
        <CloseIcon
          className="action-icon option-icon close-icon"
          alt={FONT_AWESOME_LICENSE}
          onClick={() => remote.getCurrentWindow().close()}
        />
      </div>
    </div>
  );
}