import React, { useState } from "react";

import "./auth-steps.css";

const { shell } = window.require("electron");

export function AuthSteps({
  isLoading,
  authUrl,
  oAuth2Client,
  setError,
  handleSubmitAccessCode,
}) {
  const [accessCode, setAccessCode] = useState("");

  return (
    <div className={`auth-container ${isLoading ? "hidden" : ""}`}>
      <div>{"Step 1:"}</div>
      <div className="auth-step-container">
        <div
          className="link button-link"
          onClick={(e) => {
            e.preventDefault();
            shell.openExternal(authUrl);
          }}
        >
          {"Get an access code"}
        </div>
      </div>

      {oAuth2Client && (
        <div style={{ display: "flex" }}>
          <div>{"Step 2:"}</div>
          <div className="auth-step-container">
            <input
              className="access-code-input"
              placeholder="paste code here"
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value);
                setError(null);
              }}
            />
            <div
              className="link button-link"
              onClick={() => handleSubmitAccessCode(accessCode)}
            >
              {"Submit access code"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
