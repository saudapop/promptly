import React, { useState, useEffect, useRef, useMemo } from "react";
import { get, cloneDeep } from "lodash";

import { Event } from "./components/event/event.js";
import { LoadingSpinner } from "./components/loading-spinner/loading-spinner.js";
import { Toolbar } from "./components/toolbar/toolbar.js";
import { SettingsMenu } from "./components/settings-menu/settings-menu.js";

import { login, submitAccessCodeAndGetAccessToken } from "./auth.js";
import { fetchSchedule } from "./helpers/fetch-schedule";
import { getNextMeetingInfo, ONE_MINUTE } from "./helpers/time-utils";

import "./App.css";
import { AuthSteps } from "./components/auth-steps/auth-steps.js";

const { shell, ipcRenderer } = window.require("electron");
const { platform } = window.require("os");

const DEFAULT_THEME = "default";
let OS = platform();

const WIN32 = "win32";
const DARWIN = "darwin";

// OS = WIN32;

const isWin32 = OS === WIN32;
const isDarwin = OS === DARWIN;

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
  const [shouldShowNextEventInTitleBar, setShowNextEventInTitleBar] = useState(
    JSON.parse(localStorage.getItem("shouldShowNextEventInTitleBar"))
  );
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || DEFAULT_THEME
  );
  const [initialCoordinates, setInitialCoordinates] = useState({ x: 0, y: 0 });

  const appRef = useRef();
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
      newSchedule = newSchedule.map((event, id) => {
        const isEventAutoJoin = localStorage.getItem(event.summary);
        return { ...event, autoJoin: JSON.parse(isEventAutoJoin), id };
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
      thisEvent.id === event.id
        ? { ...event, hasAlreadyJoinedMeeting: true }
        : thisEvent
    );
    setSchedule(updatedSchedule);
  }

  function handleThemeChange(color) {
    localStorage.setItem("theme", color);
    setTheme(color);
  }

  function adjustWindowPosition() {
    if (isWin32) {
      window.moveTo(initialCoordinates.x, initialCoordinates.y);
    }
  }

  useEffect(() => {
    handleLogin();
    setTimeout(
      () => setInitialCoordinates({ x: window.screenX, y: window.screenY }),
      1000
    );
  }, []);

  useEffect(
    function autoRefreshSchedule() {
      if (schedule && schedule.length > 0 && oAuth2Client) {
        const timer = setInterval(() => {
          const [meetingOne, meetingTwo] = schedule;
          const { shouldAutoJoin } = getNextMeetingInfo(meetingOne, meetingTwo);
          if (!shouldAutoJoin) {
            console.log("auto fetch schedule at ", new Date().toLocaleString());
            refetchSchedule();
          }
        }, ONE_MINUTE * 30);
        return () => clearInterval(timer);
      }
    },
    [schedule, oAuth2Client]
  );

  const [titleBarText, setTitleBarText] = useState(null);

  useEffect(
    function handleNextMeetingCalculations() {
      if (filteredSchedule && filteredSchedule.length) {
        const timer = setInterval(() => {
          const sched = cloneDeep(filteredSchedule);

          let hasMeetingHasPassed = true;
          let nextMeeting;

          while (hasMeetingHasPassed && sched.length) {
            nextMeeting = getNextMeetingInfo(sched.shift());
            hasMeetingHasPassed = nextMeeting.meetingHasPassed;
          }

          const {
            event,
            remainingTime,
            meetingHasPassed,
            shouldAutoJoin,
            textForTitleBar: newTitleBarText,
          } = nextMeeting;

          if (shouldAutoJoin) {
            autoJoinMeeting(event);
          }

          if (isDarwin) {
            const truncatedTitle =
              event.summary.length > 10
                ? event.summary.slice(0, 7) + "…"
                : event.summary;
            setTitleBarText(`${truncatedTitle}${newTitleBarText}`);
          }

          setNextMeeting(
            !meetingHasPassed && { title: event.summary, remainingTime }
          );
        }, 1000);
        return () => clearInterval(timer);
      }
    },
    [filteredSchedule, shouldShowNextEventInTitleBar]
  );

  useEffect(
    function updateTitleBarText() {
      if (shouldShowNextEventInTitleBar && titleBarText) {
        ipcRenderer.send("update-title-bar", titleBarText);
      } else {
        ipcRenderer.send("update-title-bar", "");
      }
    },
    [titleBarText, shouldShowNextEventInTitleBar]
  );

  return (
    <div
      ref={appRef}
      className={`
        App 
        ${isWindowExpanded ? "expanded" : "non-expanded"} 
        ${isWin32 ? WIN32 : ""}
      `}
    >
      {!isWin32 && <div id="arrow"></div>}

      <LoadingSpinner className={`${theme} ${isLoading ? "" : "hidden"}`} />
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
              <Event
                event={event}
                index={i}
                onEventTitleClick={onEventTitleClick}
                onEventToggle={onEventToggle}
              />
            ))}
        </div>
        {schedule && (
          <Toolbar
            appRef={appRef}
            scheduleListRef={scheduleListRef}
            refetchSchedule={refetchSchedule}
            isWindowPinned={isWindowPinned}
            setIsWindowPinned={setIsWindowPinned}
            isWindowExpanded={isWindowExpanded}
            setIsWindowExpanded={setIsWindowExpanded}
            isSettingsMenuOpen={isSettingsMenuOpen}
            setIsSettingsMenuOpen={setIsSettingsMenuOpen}
            adjustWindowPosition={adjustWindowPosition}
          />
        )}
      </div>
      <SettingsMenu
        theme={theme}
        appRef={appRef}
        scheduleListRef={scheduleListRef}
        isSettingsMenuOpen={isSettingsMenuOpen}
        isWindowExpanded={isWindowExpanded}
        isDarwin={isDarwin}
        isWin32={isWin32}
        setIsSettingsMenuOpen={setIsSettingsMenuOpen}
        handleThemeChange={handleThemeChange}
        adjustWindowPosition={adjustWindowPosition}
        shouldShowEventsWithVideoLinks={shouldShowEventsWithVideoLinks}
        setShouldShowEventsWithVideoLinks={setShouldShowEventsWithVideoLinks}
        shouldShowNextEventInTitleBar={shouldShowNextEventInTitleBar}
        setShowNextEventInTitleBar={setShowNextEventInTitleBar}
      />
      {isWin32 && <div id="arrow" className={WIN32}></div>}
    </div>
  );
}

export default App;
