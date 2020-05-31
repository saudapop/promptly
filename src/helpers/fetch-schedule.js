const { google } = window.require("googleapis");
const { CustomTime } = require("./time-utils");

const HOUR = 18;
const MINS = 0;
const NOW = () => new Date().toISOString();
const URL_REGEX = new RegExp(
  /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi
);
const isVideoLinkIncludedInUrl = (url) =>
  url.includes("zoom") || url.includes("meet.google");

const END_OF_DAY = new CustomTime()
  .setHours(HOUR)
  .setMinutes(MINS)
  .toISOString();

/**
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
export async function fetchSchedule(auth) {
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: NOW(),
    // timeMax: END_OF_DAY,
    maxResults: 30,
    singleEvents: true,
    orderBy: "startTime",
  });
  const events = res.data.items;
  if (events.length) {
    let schedule = events.map(
      ({
        conferenceData,
        description,
        summary,
        start: { dateTime, date },
        location,
      }) => {
        const parsedEvent = { summary, start: dateTime || date };

        if (conferenceData) {
          const entryPoint = conferenceData.entryPoints.filter(
            (ep) => ep.entryPointType === "video"
          )[0];
          const url = entryPoint.uri;
          return { ...parsedEvent, url };
        }

        if (location) {
          const urls = location.match(URL_REGEX);
          const url = urls && urls[0];
          if (url && isVideoLinkIncludedInUrl(url)) {
            return { ...parsedEvent, url };
          }
        }

        if (description) {
          const urls = description.match(URL_REGEX);
          const url = urls && urls[0];
          if (url && isVideoLinkIncludedInUrl(url)) {
            return { ...parsedEvent, url };
          }
        }
        return parsedEvent;
      }
    );
    schedule = schedule.filter((event) => !!event);
    return schedule;
  }
}
