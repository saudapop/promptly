import React, { useState, useEffect, useRef, useMemo } from "react";
import { get, cloneDeep } from "lodash";

import { LoadingSpinner } from "./components/loading-spinner/loading-spinner.js";
import { Toolbar } from "./components/toolbar/toolbar.js";
import { ToggleSlider } from "./components/toggle-slider/toggle-slider.js";
import { SettingsMenu } from "./components/settings-menu/settings-menu.js";

import { login, submitAccessCodeAndGetAccessToken } from "./auth.js";
import { fetchSchedule } from "./helpers/fetch-schedule";
import { getNextMeetingInfo, ONE_MINUTE } from "./helpers/time-utils";

import "./App.css";
import { AuthSteps } from "./components/auth-steps/auth-steps.js";

const { shell } = window.require("electron");

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState("");
  const [oAuth2Client, setOAuth2client] = useState();
  const [error, setError] = useState();
  const [schedule, setSchedule] = useState();
  const [nextMeeting, setNextMeeting] = useState();

  const [isWindowExpanded, setIsWindowExpanded] = useState(false);
  const [isWindowPinned, setIsWindowPinned] = useState(false);
  const [
    shouldShowEventsWithVideoLinks,
    setShouldShowEventsWithVideoLinks,
  ] = useState(
    JSON.parse(localStorage.getItem("shouldShowEventsWithoutVideoLinks"))
  );
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "");

  const scheduleListRef = useRef();

  const filteredSchedule = useMemo(
    () =>
      schedule &&
      schedule.filter((evt) => {
        if (shouldShowEventsWithVideoLinks) {
          return true;
        }
        return !!evt.url;
      }),
    [schedule, shouldShowEventsWithVideoLinks]
  );

  async function handleFetchSchedule(client) {
    let newSchedule = await fetchSchedule(client);
    if (newSchedule) {
      newSchedule = newSchedule.map((event) => {
        const isEventAutoJoin = localStorage.getItem(event.summary);
        return { ...event, autoJoin: JSON.parse(isEventAutoJoin) };
      });
    } else {
      newSchedule = [];
    }
    setSchedule(newSchedule);
  }

  async function refetchSchedule() {
    setIsLoading(true);
    console.log("fetching schedule at ", new Date());
    await handleFetchSchedule(oAuth2Client);
    setIsLoading(false);
  }

  async function handleLogin() {
    setIsLoading(true);
    try {
      const { oAuth2Client: authClient, authUrl } = await login();
      if (authUrl) {
        setAuthUrl(authUrl);
      } else {
        await handleFetchSchedule(authClient);
      }
      setOAuth2client(authClient);
      setIsLoading(false);
    } catch (e) {
      console.log(e);
      console.log("failed");
      setIsLoading(false);
      setError(
        get(e, "error") ||
          get(e, "error.response.data") || {
            error: "Couldn't read or find the credentials.json file",
            error_description:
              "The credentials.json file should be located in the same folder as the app.",
          }
      );
    }
  }

  async function handleSubmitAccessCode(accessCode) {
    setIsLoading(true);
    try {
      await submitAccessCodeAndGetAccessToken(oAuth2Client, accessCode);
      await handleLogin();
      setAuthUrl(null);
    } catch (e) {
      console.log(e);
      setIsLoading(false);
      setError(
        get(e, "error.response.data", {
          error: "Failed to get access token",
          error_description:
            "Most likely either missing a code or an incorrect code",
        })
      );
    }
  }

  const onEventTitleClick = (e, url) => {
    e.preventDefault();
    shell.openExternal(url);
  };

  function onEventToggle(event) {
    let updatedSchedule = cloneDeep(schedule);
    updatedSchedule = updatedSchedule.map((thisEvent) =>
      thisEvent.summary === event.summary
        ? { ...event, autoJoin: !event.autoJoin }
        : thisEvent
    );
    localStorage.setItem(event.summary, !event.autoJoin);
    setSchedule(updatedSchedule);
  }

  function autoJoinMeeting(event) {
    shell.openExternal(event.url);
    let updatedSchedule = cloneDeep(schedule);
    updatedSchedule = updatedSchedule.map((thisEvent, i) =>
      thisEvent.summary === event.summary && (i === 0 || i === 1)
        ? { ...event, hasAlreadyJoinedMeeting: true }
        : thisEvent
    );
    setSchedule(updatedSchedule);
  }

  function handleThemeChange(color) {
    localStorage.setItem("theme", color);
    setTheme(color);
  }

  useEffect(() => {
    handleLogin();
  }, []);

  useEffect(
    function autoRefreshSchedule() {
      if (schedule && schedule.length > 0 && oAuth2Client) {
        const timer = setInterval(() => {
          const [meetingOne, meetingTwo] = schedule;
          const { shouldAutoJoin } = getNextMeetingInfo(meetingOne, meetingTwo);
          if (!shouldAutoJoin) {
            refetchSchedule();
          }
        }, ONE_MINUTE * 30);
        return () => clearInterval(timer);
      }
    },
    [schedule, oAuth2Client]
  );

  useEffect(
    function handleNextMeetingCalculations() {
      if (filteredSchedule && filteredSchedule.length) {
        const timer = setInterval(() => {
          const [meetingOne, meetingTwo] = filteredSchedule;
          const {
            event,
            remainingTime,
            meetingHasPassed,
            shouldAutoJoin,
          } = getNextMeetingInfo(meetingOne, meetingTwo);

          if (shouldAutoJoin) {
            autoJoinMeeting(event);
          }
          setNextMeeting(
            !meetingHasPassed && { title: event.summary, remainingTime }
          );
        }, 1000);
        return () => clearInterval(timer);
      }
    },
    [filteredSchedule]
  );

  return (
    <div className={`App ${isWindowExpanded ? "expanded" : ""}`}>
      {<LoadingSpinner className={`${theme} ${isLoading ? "" : "hidden"}`} />}
      {error && (
        <div className="error">
          <div>{error.error}</div>
          <div>{error.error_description || error.message}</div>
        </div>
      )}
      {authUrl && (
        <AuthSteps
          isLoading={isLoading}
          authUrl={authUrl}
          oAuth2Client={oAuth2Client}
          setError={setError}
          handleSubmitAccessCode={handleSubmitAccessCode}
        />
      )}
      <div
        className={`
          schedule-container 
          ${theme} 
          ${isLoading || authUrl ? "hidden" : ""}
          ${isSettingsMenuOpen ? "blur" : ""}
        `}
      >
        <div
          className={`next-meeting-container ${!nextMeeting ? "hidden" : ""}`}
        >
          {nextMeeting && (
            <>
              <div className="countdown-clock">{nextMeeting.remainingTime}</div>
              {"until"}
              <div className="next-meeting-name" title={nextMeeting.title}>
                {nextMeeting.title}
              </div>
            </>
          )}
        </div>
        <div ref={scheduleListRef} className="events-list">
          {filteredSchedule && !filteredSchedule.length && (
            <div className="no-events-message">
              There are no events scheduled
            </div>
          )}
          {filteredSchedule &&
            filteredSchedule.map((event, i) => (
              <div className="event-container" key={`${event.url}-${i}`}>
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
            ))}
        </div>
        {schedule && (
          <Toolbar
            scheduleListRef={scheduleListRef}
            refetchSchedule={refetchSchedule}
            isWindowPinned={isWindowPinned}
            setIsWindowPinned={setIsWindowPinned}
            isWindowExpanded={isWindowExpanded}
            setIsWindowExpanded={setIsWindowExpanded}
            isSettingsMenuOpen={isSettingsMenuOpen}
            setIsSettingsMenuOpen={setIsSettingsMenuOpen}
          />
        )}
      </div>
      <SettingsMenu
        isSettingsMenuOpen={isSettingsMenuOpen}
        setIsSettingsMenuOpen={setIsSettingsMenuOpen}
        handleThemeChange={handleThemeChange}
        theme={theme}
        shouldShowEventsWithVideoLinks={shouldShowEventsWithVideoLinks}
        setShouldShowEventsWithVideoLinks={setShouldShowEventsWithVideoLinks}
      />
    </div>
  );
}

export default App;
