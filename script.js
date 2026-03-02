const form = document.getElementById("pay-form");
const payTypeInputs = document.querySelectorAll('input[name="payType"]');
const hourlyRateField = document.getElementById("hourly-rate-field");
const salaryField = document.getElementById("salary-field");
const hourlyRateInput = document.getElementById("hourlyRate");
const annualSalaryInput = document.getElementById("annualSalary");
const hoursPerWeekInput = document.getElementById("hoursPerWeek");
const minutesPerVisitInput = document.getElementById("minutesPerVisit");
const visitsPerDayInput = document.getElementById("visitsPerDay");
const workdaysPerWeekInput = document.getElementById("workdaysPerWeek");
const formError = document.getElementById("form-error");

const output = {
  effectiveHourly: document.getElementById("effectiveHourly"),
  perVisit: document.getElementById("perVisit"),
  perDay: document.getElementById("perDay"),
  perWeek: document.getElementById("perWeek"),
  perMonth: document.getElementById("perMonth"),
  perYear: document.getElementById("perYear"),
  bathroomTime: document.getElementById("bathroomTime"),
  summary: document.getElementById("summary")
};

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function readNumber(input) {
  return Number.parseFloat(input.value);
}

function getPayType() {
  const selected = Array.from(payTypeInputs).find((input) => input.checked);
  return selected ? selected.value : "hourly";
}

function togglePayType() {
  const payType = getPayType();
  const isHourly = payType === "hourly";

  hourlyRateField.classList.toggle("hidden", !isHourly);
  salaryField.classList.toggle("hidden", isHourly);

  hourlyRateInput.required = isHourly;
  annualSalaryInput.required = !isHourly;
}

function toHoursAndMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}h ${minutes}m`;
}

function validateInputs(data) {
  if (!Number.isFinite(data.hoursPerWeek) || data.hoursPerWeek <= 0) {
    return "Hours worked per week must be greater than 0.";
  }

  if (!Number.isFinite(data.minutesPerVisit) || data.minutesPerVisit <= 0) {
    return "Bathroom minutes per visit must be greater than 0.";
  }

  if (!Number.isFinite(data.visitsPerDay) || data.visitsPerDay <= 0) {
    return "Visits per workday must be greater than 0.";
  }

  if (!Number.isFinite(data.workdaysPerWeek) || data.workdaysPerWeek <= 0 || data.workdaysPerWeek > 7) {
    return "Workdays per week must be between 1 and 7.";
  }

  if (data.payType === "hourly") {
    if (!Number.isFinite(data.hourlyRate) || data.hourlyRate < 0) {
      return "Hourly rate must be 0 or greater.";
    }
  } else if (!Number.isFinite(data.annualSalary) || data.annualSalary < 0) {
    return "Annual salary must be 0 or greater.";
  }

  return "";
}

function calculate(data) {
  const effectiveHourly =
    data.payType === "hourly"
      ? data.hourlyRate
      : data.annualSalary / (data.hoursPerWeek * WEEKS_PER_YEAR);

  const perMinute = effectiveHourly / 60;
  const perVisit = perMinute * data.minutesPerVisit;
  const perDay = perVisit * data.visitsPerDay;
  const perWeek = perDay * data.workdaysPerWeek;
  const perMonth = (perWeek * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
  const perYear = perWeek * WEEKS_PER_YEAR;
  const bathroomMinutesPerWeek = data.minutesPerVisit * data.visitsPerDay * data.workdaysPerWeek;

  return {
    effectiveHourly,
    perVisit,
    perDay,
    perWeek,
    perMonth,
    perYear,
    bathroomMinutesPerWeek
  };
}

function render(result, data) {
  output.effectiveHourly.textContent = formatMoney(result.effectiveHourly);
  output.perVisit.textContent = formatMoney(result.perVisit);
  output.perDay.textContent = formatMoney(result.perDay);
  output.perWeek.textContent = formatMoney(result.perWeek);
  output.perMonth.textContent = formatMoney(result.perMonth);
  output.perYear.textContent = formatMoney(result.perYear);
  output.bathroomTime.textContent = toHoursAndMinutes(result.bathroomMinutesPerWeek);

  output.summary.textContent = `At ${data.visitsPerDay} visit(s) a day for ${data.minutesPerVisit} minute(s) each, you earn about ${formatMoney(
    result.perYear
  )} per year while taking care of business.`;
}

function onSubmit(event) {
  event.preventDefault();

  const data = {
    payType: getPayType(),
    hourlyRate: readNumber(hourlyRateInput),
    annualSalary: readNumber(annualSalaryInput),
    hoursPerWeek: readNumber(hoursPerWeekInput),
    minutesPerVisit: readNumber(minutesPerVisitInput),
    visitsPerDay: readNumber(visitsPerDayInput),
    workdaysPerWeek: readNumber(workdaysPerWeekInput)
  };

  const error = validateInputs(data);
  formError.textContent = error;

  if (error) {
    return;
  }

  const result = calculate(data);
  render(result, data);
}

payTypeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    togglePayType();
    form.dispatchEvent(new Event("submit", { cancelable: true }));
  });
});

form.addEventListener("submit", onSubmit);
togglePayType();
form.dispatchEvent(new Event("submit", { cancelable: true }));
