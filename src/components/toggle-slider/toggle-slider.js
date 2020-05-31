import React from "react";

import "./toggle-slider.css";

export function ToggleSlider({
  containerClassName,
  className,
  disabled = false,
  checked,
  onChange,
}) {
  return (
    <div className={containerClassName}>
      <label className={`switch ${className}`}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
        />
        <span className="slider round"></span>
      </label>
    </div>
  );
}
