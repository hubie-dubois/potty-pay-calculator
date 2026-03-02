const test = require("node:test");
const assert = require("node:assert/strict");

const {
  computeMetrics,
  formatClock,
  readNum,
  validateBase,
  annualEquivalents
} = require("../calculator-engine.js");

test("computeMetrics handles hourly inputs correctly", () => {
  const result = computeMetrics({
    payType: "hourly",
    hourlyRate: 30,
    annualSalary: 0,
    hoursPerWeek: 40,
    workdaysPerWeek: 5,
    poopMinutesPerVisit: 12,
    peeMinutesPerVisit: 4,
    visitsPerDay: 3,
    poopVisitsPerDay: 1,
    weeksPerYear: 50
  });

  assert.equal(result.effectiveHourly, 30);
  assert.equal(result.perMinute, 0.5);
  assert.equal(result.perVisit, 10 / 3);
  assert.equal(result.perDay, 10);
  assert.equal(result.perWeek, 50);
  assert.equal(result.perYear, 2500);
  assert.equal(result.perMonth, 2500 / 12);
  assert.equal(result.poopPerDay, 6);
  assert.equal(result.peePerDay, 4);
});

test("computeMetrics handles salary inputs correctly", () => {
  const result = computeMetrics({
    payType: "salary",
    hourlyRate: 0,
    annualSalary: 104000,
    hoursPerWeek: 40,
    workdaysPerWeek: 5,
    poopMinutesPerVisit: 12,
    peeMinutesPerVisit: 6,
    visitsPerDay: 2,
    poopVisitsPerDay: 1,
    weeksPerYear: 52
  });

  assert.equal(result.effectiveHourly, 50);
  assert.equal(result.perMinute, 50 / 60);
  assert.equal(result.perVisit, 7.5);
  assert.equal(result.perDay, 15);
  assert.equal(result.perWeek, 75);
  assert.equal(result.perYear, 3900);
});

test("validateBase rejects invalid values", () => {
  const badData = {
    payType: "hourly",
    hourlyRate: -1,
    annualSalary: 0,
    hoursPerWeek: 0,
    workdaysPerWeek: 8,
    poopMinutesPerVisit: 0,
    peeMinutesPerVisit: 0,
    visitsPerDay: 0,
    poopVisitsPerDay: 0,
    weeksPerYear: 0
  };

  assert.equal(validateBase(badData), "Hours/week must be > 0.");
});

test("validateBase accepts realistic 60-hour schedule", () => {
  const goodData = {
    payType: "salary",
    hourlyRate: 0,
    annualSalary: 120000,
    hoursPerWeek: 60,
    workdaysPerWeek: 6,
    poopMinutesPerVisit: 14,
    peeMinutesPerVisit: 6,
    visitsPerDay: 4,
    poopVisitsPerDay: 2,
    weeksPerYear: 50
  };

  assert.equal(validateBase(goodData), "");
});

test("formatClock formats seconds to mm:ss", () => {
  assert.equal(formatClock(0), "00:00");
  assert.equal(formatClock(9), "00:09");
  assert.equal(formatClock(65), "01:05");
  assert.equal(formatClock(754), "12:34");
});

test("readNum parses decimal strings", () => {
  assert.equal(readNum("31.5"), 31.5);
});

test("annualEquivalents returns 4 comparison rows", () => {
  const rows = annualEquivalents(4200);
  assert.equal(rows.length, 4);
  assert.match(rows[0], /fancy coffees/);
});
