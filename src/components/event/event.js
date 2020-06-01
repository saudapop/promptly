import React from "react";
import { ToggleSlider } from "../toggle-slider/toggle-slider.js";

import "./event.css";

export function Event({ event, index, onEventTitleClick, onEventToggle }) {
  return (
    <div className="event-container" key={`${event.url}-${index}`}>
      <div
        title={event.url}
        className={`event-title ${event.url ? "link" : ""}`}
        onClick={(e) => {
          if (event.url) {
            onEventTitleClick(e, event.url);
          }
        }}
      >
        {event.summary}
      </div>
      <div className="event-time">
        {new Date(event.start)
          .toLocaleString([], {
            weekday: "short",
            month: "numeric",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
          .split(",")
          .map((field) => (
            <div key={field}>{field.toLocaleUpperCase()}</div>
          ))}
      </div>
      <ToggleSlider
        className={event.url ? "" : "disabled"}
        checked={!!event.autoJoin}
        disabled={!event.url}
        onChange={() => onEventToggle(event)}
      />
    </div>
  );
}
