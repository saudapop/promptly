// The alternative to using a class might look like this:
// new Date(new Date(new Date().setHours(hour)).setMinutes(mins)).toISOString()
//
// or
//
// let newTime = new Date().setHours(hour)
// newTime = new Date(newTime).setMinutes(mins)
// newTime = new Date(newTime).toISOString()
//
// instead of
//
// CustomTime().setHours(11).setMinutes(30).toISOString()
export class CustomTime {
  constructor() {
    this.time = new Date();
  }

  setHours(hour) {
    this.time = new Date(this.time).setHours(hour);
    return this;
  }

  setMinutes(mins) {
    this.time = new Date(this.time).setMinutes(mins);
    return this;
  }

  toISOString() {
    return new Date(this.time).toISOString();
  }
}

const show = (label, abbr) => (!!label ? label + abbr : "");

const ONE_MILLISECOND = 1;
const ONE_SECOND = ONE_MILLISECOND * 1000;
export const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_MINUTE * 60;

const HOURS_PER_DAY = 24;

const MS_PER_DAY = ONE_HOUR * HOURS_PER_DAY;

export function getNextMeetingInfo(event, meetingTwo) {
  const remainingTimeInMilliseconds = new Date(event.start) - new Date();
  const days = Math.floor(
    remainingTimeInMilliseconds / (ONE_HOUR * HOURS_PER_DAY)
  );
  const hours = Math.floor(
    (remainingTimeInMilliseconds % (ONE_HOUR * HOURS_PER_DAY)) / ONE_HOUR
  );
  const minutes = Math.floor(
    (remainingTimeInMilliseconds % ONE_HOUR) / ONE_MINUTE
  );
  const seconds = Math.floor(
    (remainingTimeInMilliseconds % ONE_MINUTE) / ONE_SECOND
  );
  const meetingHasPassed = days < 0 && hours < 0 && minutes < 0 && seconds < 0;

  const shouldAutoJoin =
    days === 0 &&
    hours === 0 &&
    minutes < 2 &&
    event.autoJoin &&
    !event.hasAlreadyJoinedMeeting &&
    event.url;

  const d = show(days, "d");
  const h = show(hours, "h");
  const m = show(minutes, "m");

  const textForTitleBar = d ? d + h : h + m;

  return {
    event,
    remainingTime: `${d} ${h} ${minutes}m ${seconds}s`,
    title: event.summary,
    meetingHasPassed,
    shouldAutoJoin,
    url: event.url,
    textForTitleBar,
  };
}
