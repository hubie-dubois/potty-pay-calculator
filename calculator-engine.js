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

  function validateBase(data) {
    if (!Number.isFinite(data.hoursPerWeek) || data.hoursPerWeek <= 0) return "Hours/week must be > 0.";
    if (!Number.isFinite(data.workdaysPerWeek) || data.workdaysPerWeek <= 0 || data.workdaysPerWeek > 7) {
      return "Workdays/week must be 1-7.";
    }
    if (!Number.isFinite(data.minutesPerVisit) || data.minutesPerVisit <= 0) return "Minutes/visit must be > 0.";
    if (!Number.isFinite(data.visitsPerDay) || data.visitsPerDay <= 0) return "Visits/day must be > 0.";
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
    const effectiveHourly =
      data.payType === "salary"
        ? data.annualSalary / (data.hoursPerWeek * Math.max(data.weeksPerYear, 1))
        : data.hourlyRate;

    const perMinute = effectiveHourly / 60;
    const perVisit = perMinute * data.minutesPerVisit;
    const perDay = perVisit * data.visitsPerDay;
    const perWeek = perDay * data.workdaysPerWeek;
    const perYear = perWeek * data.weeksPerYear;
    const perMonth = perYear / 12;

    return { effectiveHourly, perMinute, perVisit, perDay, perWeek, perMonth, perYear };
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
