(function (global) {
  "use strict";

  function money(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(value);
  }

  function readNum(value) {
    return Number.parseFloat(value);
  }

  function resolveVisitProfile(data) {
    const visitsPerDay = data.visitsPerDay;
    const poopVisitsPerDay = Number.isFinite(data.poopVisitsPerDay) ? data.poopVisitsPerDay : 0;
    const poopMinutesPerVisit = Number.isFinite(data.poopMinutesPerVisit)
      ? data.poopMinutesPerVisit
      : data.minutesPerVisit;
    const peeMinutesPerVisit = Number.isFinite(data.peeMinutesPerVisit)
      ? data.peeMinutesPerVisit
      : data.minutesPerVisit;

    return { visitsPerDay, poopVisitsPerDay, poopMinutesPerVisit, peeMinutesPerVisit };
  }

  function validateBase(data) {
    if (!Number.isFinite(data.hoursPerWeek) || data.hoursPerWeek <= 0) return "Hours/week must be > 0.";
    if (!Number.isFinite(data.workdaysPerWeek) || data.workdaysPerWeek <= 0 || data.workdaysPerWeek > 7) {
      return "Workdays/week must be 1-7.";
    }
    const visitProfile = resolveVisitProfile(data);

    if (!Number.isFinite(visitProfile.poopMinutesPerVisit) || visitProfile.poopMinutesPerVisit <= 0) {
      return "Poop minutes/visit must be > 0.";
    }
    if (!Number.isFinite(visitProfile.peeMinutesPerVisit) || visitProfile.peeMinutesPerVisit <= 0) {
      return "Pee minutes/visit must be > 0.";
    }
    if (!Number.isFinite(visitProfile.visitsPerDay) || visitProfile.visitsPerDay <= 0) {
      return "Visits/day must be > 0.";
    }
    if (!Number.isFinite(visitProfile.poopVisitsPerDay) || visitProfile.poopVisitsPerDay < 0) {
      return "Poop visits per workday must be 0 or greater.";
    }
    if (visitProfile.poopVisitsPerDay > visitProfile.visitsPerDay) {
      return "Poop visits per workday cannot be greater than total visits per workday.";
    }
    if (!Number.isFinite(data.weeksPerYear) || data.weeksPerYear <= 0 || data.weeksPerYear > 52) {
      return "Weeks/year must be 1-52.";
    }
    if (data.payType === "hourly" && (!Number.isFinite(data.hourlyRate) || data.hourlyRate < 0)) {
      return "Hourly rate must be >= 0.";
    }
    if (data.payType === "salary" && (!Number.isFinite(data.annualSalary) || data.annualSalary < 0)) {
      return "Salary must be >= 0.";
    }
    return "";
  }

  function computeMetrics(data) {
    const visitProfile = resolveVisitProfile(data);
    const effectiveHourly =
      data.payType === "salary"
        ? data.annualSalary / (data.hoursPerWeek * Math.max(data.weeksPerYear, 1))
        : data.hourlyRate;

    const peeVisitsPerDay = Math.max(visitProfile.visitsPerDay - visitProfile.poopVisitsPerDay, 0);
    const poopMinutesPerDay = visitProfile.poopMinutesPerVisit * visitProfile.poopVisitsPerDay;
    const peeMinutesPerDay = visitProfile.peeMinutesPerVisit * peeVisitsPerDay;
    const totalMinutesPerDay = poopMinutesPerDay + peeMinutesPerDay;
    const averageMinutesPerVisit =
      visitProfile.visitsPerDay > 0 ? totalMinutesPerDay / visitProfile.visitsPerDay : 0;

    const perMinute = effectiveHourly / 60;
    const perVisit = perMinute * averageMinutesPerVisit;
    const perDay = perMinute * totalMinutesPerDay;
    const perWeek = perDay * data.workdaysPerWeek;
    const perYear = perWeek * data.weeksPerYear;
    const perMonth = perYear / 12;
    const poopPerDay = perMinute * poopMinutesPerDay;
    const peePerDay = perMinute * peeMinutesPerDay;

    return {
      effectiveHourly,
      perMinute,
      perVisit,
      perDay,
      perWeek,
      perMonth,
      perYear,
      poopPerDay,
      peePerDay,
      poopPerYear: poopPerDay * data.workdaysPerWeek * data.weeksPerYear,
      peePerYear: peePerDay * data.workdaysPerWeek * data.weeksPerYear,
      poopMinutesPerDay,
      peeMinutesPerDay,
      totalMinutesPerDay,
      averageMinutesPerVisit,
      peeVisitsPerDay
    };
  }

  function annualEquivalents(yearly) {
    return [
      `${(yearly / 5.25).toFixed(0)} fancy coffees`,
      `${(yearly / 14).toFixed(0)} food truck lunches`,
      `${(yearly / 75).toFixed(1)} months of streaming bundles`,
      `${(yearly / 1200).toFixed(2)} bargain weekend trips`
    ];
  }

  function formatClock(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  const api = {
    annualEquivalents,
    computeMetrics,
    formatClock,
    money,
    readNum,
    validateBase
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.PottyPayEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
