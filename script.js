const DEFAULT_WEEKS = 52;
const STORAGE_KEY = "potty_pay_lifetime";

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

function initCalculatorPage() {
  const form = document.getElementById("calculator-form");
  if (!form) return;

  const hourlyWrap = document.getElementById("hourlyWrap");
  const salaryWrap = document.getElementById("salaryWrap");
  const calcError = document.getElementById("calcError");

  const inputs = {
    payType: form.querySelectorAll('input[name="payType"]'),
    hourlyRate: document.getElementById("hourlyRate"),
    annualSalary: document.getElementById("annualSalary"),
    hoursPerWeek: document.getElementById("hoursPerWeek"),
    workdaysPerWeek: document.getElementById("workdaysPerWeek"),
    minutesPerVisit: document.getElementById("minutesPerVisit"),
    visitsPerDay: document.getElementById("visitsPerDay"),
    poopPercent: document.getElementById("poopPercent"),
    weeksPerYear: document.getElementById("weeksPerYear")
  };

  const output = {
    hourly: document.getElementById("rHourly"),
    visit: document.getElementById("rVisit"),
    day: document.getElementById("rDay"),
    week: document.getElementById("rWeek"),
    month: document.getElementById("rMonth"),
    year: document.getElementById("rYear"),
    breakdown: document.getElementById("breakdownText"),
    poopBar: document.getElementById("poopBar"),
    peeBar: document.getElementById("peeBar"),
    equivalents: document.getElementById("equivalents")
  };

  const timer = {
    clock: document.getElementById("timerClock"),
    earned: document.getElementById("timerEarned"),
    meta: document.getElementById("timerMeta"),
    start: document.getElementById("startTimer"),
    stop: document.getElementById("stopTimer"),
    reset: document.getElementById("resetTimer"),
    lifetime: document.getElementById("lifetimeTotal")
  };

  const fortunes = [
    "The spreadsheet fears your bowel confidence.",
    "A high-value meeting will start exactly when you stand up.",
    "Today your throne ROI beats your lunch budget.",
    "Productivity tip: schedule your break before the status call.",
    "You are one flush away from financial enlightenment."
  ];

  let latestMetrics = null;
  let elapsed = 0;
  let tickId = null;

  function getPayType() {
    const active = Array.from(inputs.payType).find((radio) => radio.checked);
    return active ? active.value : "hourly";
  }

  function currentData() {
    return {
      payType: getPayType(),
      hourlyRate: readNum(inputs.hourlyRate.value),
      annualSalary: readNum(inputs.annualSalary.value),
      hoursPerWeek: readNum(inputs.hoursPerWeek.value),
      workdaysPerWeek: readNum(inputs.workdaysPerWeek.value),
      minutesPerVisit: readNum(inputs.minutesPerVisit.value),
      visitsPerDay: readNum(inputs.visitsPerDay.value),
      poopPercent: readNum(inputs.poopPercent.value),
      weeksPerYear: readNum(inputs.weeksPerYear.value)
    };
  }

  function setPayVisibility() {
    const isHourly = getPayType() === "hourly";
    hourlyWrap.classList.toggle("hidden", !isHourly);
    salaryWrap.classList.toggle("hidden", isHourly);
    inputs.hourlyRate.required = isHourly;
    inputs.annualSalary.required = !isHourly;
  }

  function clampPoopPercent(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }

  function renderLifetime() {
    const stored = Number.parseFloat(localStorage.getItem(STORAGE_KEY) || "0");
    timer.lifetime.textContent = `Lifetime tracked throne earnings in this browser: ${money(stored)}`;
  }

  function saveLifetime(delta) {
    const stored = Number.parseFloat(localStorage.getItem(STORAGE_KEY) || "0");
    localStorage.setItem(STORAGE_KEY, String(stored + delta));
    renderLifetime();
  }

  function render(metrics, data) {
    latestMetrics = metrics;
    output.hourly.textContent = money(metrics.effectiveHourly);
    output.visit.textContent = money(metrics.perVisit);
    output.day.textContent = money(metrics.perDay);
    output.week.textContent = money(metrics.perWeek);
    output.month.textContent = money(metrics.perMonth);
    output.year.textContent = money(metrics.perYear);

    const poopPct = clampPoopPercent(data.poopPercent);
    const peePct = 100 - poopPct;
    const poopYear = (metrics.perYear * poopPct) / 100;
    const peeYear = metrics.perYear - poopYear;

    output.breakdown.textContent = `${money(poopYear)} from poop visits and ${money(peeYear)} from pee visits per year.`;
    output.poopBar.style.width = `${poopPct}%`;
    output.peeBar.style.width = `${peePct}%`;

    output.equivalents.innerHTML = "";
    annualEquivalents(metrics.perYear).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      output.equivalents.appendChild(li);
    });

    timer.meta.textContent = `Earning rate while seated: ${money(metrics.perMinute)} per minute.`;
  }

  function recalc() {
    const data = currentData();
    const error = validateBase(data);
    calcError.textContent = error;
    if (error) return;

    const metrics = computeMetrics(data);
    render(metrics, data);
  }

  function setFortune() {
    const el = document.getElementById("fortuneText");
    if (!el) return;
    const idx = Math.floor(Math.random() * fortunes.length);
    el.textContent = fortunes[idx];
  }

  function applyPreset(name) {
    const presets = {
      part: { payType: "hourly", hourlyRate: 22, hoursPerWeek: 20, workdaysPerWeek: 4, minutesPerVisit: 8, visitsPerDay: 2, poopPercent: 30, weeksPerYear: 48 },
      classic: { payType: "hourly", hourlyRate: 31.5, hoursPerWeek: 40, workdaysPerWeek: 5, minutesPerVisit: 11, visitsPerDay: 3, poopPercent: 35, weeksPerYear: 50 },
      grind: { payType: "salary", annualSalary: 115000, hoursPerWeek: 60, workdaysPerWeek: 6, minutesPerVisit: 14, visitsPerDay: 4, poopPercent: 40, weeksPerYear: 50 },
      chaos: { payType: "hourly", hourlyRate: 29, hoursPerWeek: 45, workdaysPerWeek: 5, minutesPerVisit: 9, visitsPerDay: 6, poopPercent: 28, weeksPerYear: 50 }
    };

    const preset = presets[name];
    if (!preset) return;

    const targetType = preset.payType || "hourly";
    inputs.payType.forEach((radio) => {
      radio.checked = radio.value === targetType;
    });

    if (preset.hourlyRate !== undefined) inputs.hourlyRate.value = String(preset.hourlyRate);
    if (preset.annualSalary !== undefined) inputs.annualSalary.value = String(preset.annualSalary);
    inputs.hoursPerWeek.value = String(preset.hoursPerWeek);
    inputs.workdaysPerWeek.value = String(preset.workdaysPerWeek);
    inputs.minutesPerVisit.value = String(preset.minutesPerVisit);
    inputs.visitsPerDay.value = String(preset.visitsPerDay);
    inputs.poopPercent.value = String(preset.poopPercent);
    inputs.weeksPerYear.value = String(preset.weeksPerYear);

    setPayVisibility();
    recalc();
  }

  function drawTimer() {
    const perSecond = latestMetrics ? latestMetrics.effectiveHourly / 3600 : 0;
    timer.clock.textContent = formatClock(elapsed);
    timer.earned.textContent = money(elapsed * perSecond);
  }

  function startTimer() {
    if (tickId || !latestMetrics) return;
    tickId = window.setInterval(() => {
      elapsed += 1;
      drawTimer();
    }, 1000);
  }

  function stopTimer() {
    if (!tickId) return;
    window.clearInterval(tickId);
    tickId = null;
    const perSecond = latestMetrics ? latestMetrics.effectiveHourly / 3600 : 0;
    saveLifetime(elapsed * perSecond);
  }

  function resetTimer() {
    stopTimer();
    elapsed = 0;
    drawTimer();
  }

  Array.from(form.elements).forEach((el) => {
    el.addEventListener("input", recalc);
    el.addEventListener("change", () => {
      setPayVisibility();
      recalc();
    });
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });

  if (timer.start) timer.start.addEventListener("click", startTimer);
  if (timer.stop) timer.stop.addEventListener("click", stopTimer);
  if (timer.reset) timer.reset.addEventListener("click", resetTimer);

  const fortuneBtn = document.getElementById("newFortune");
  if (fortuneBtn) fortuneBtn.addEventListener("click", setFortune);

  setPayVisibility();
  renderLifetime();
  setFortune();
  recalc();
  drawTimer();

  window.addEventListener("beforeunload", stopTimer);
}

function readScenario(form) {
  return {
    payType: "hourly",
    hourlyRate: readNum(form.elements.hourlyRate.value),
    annualSalary: 0,
    hoursPerWeek: readNum(form.elements.hoursPerWeek.value),
    workdaysPerWeek: readNum(form.elements.workdaysPerWeek.value),
    minutesPerVisit: readNum(form.elements.minutesPerVisit.value),
    visitsPerDay: readNum(form.elements.visitsPerDay.value),
    weeksPerYear: readNum(form.elements.weeksPerYear.value)
  };
}

function initLabPage() {
  const formA = document.getElementById("scenarioA");
  const formB = document.getElementById("scenarioB");
  if (!formA || !formB) return;

  const aYear = formA.querySelector("[data-year]");
  const bYear = formB.querySelector("[data-year]");
  const winnerTitle = document.getElementById("winnerTitle");
  const winnerText = document.getElementById("winnerText");
  const deltaFill = document.getElementById("deltaFill");

  function recalcLab() {
    const aData = readScenario(formA);
    const bData = readScenario(formB);

    const errA = validateBase(aData);
    const errB = validateBase(bData);

    if (errA || errB) {
      winnerTitle.textContent = "Fix invalid numbers";
      winnerText.textContent = errA || errB;
      deltaFill.style.width = "0%";
      return;
    }

    const a = computeMetrics(aData);
    const b = computeMetrics(bData);

    aYear.textContent = money(a.perYear);
    bYear.textContent = money(b.perYear);

    const max = Math.max(a.perYear, b.perYear, 1);
    const delta = Math.abs(a.perYear - b.perYear);
    const deltaPct = (delta / max) * 100;

    deltaFill.style.width = `${Math.max(4, deltaPct)}%`;

    if (a.perYear === b.perYear) {
      winnerTitle.textContent = "Dead heat";
      winnerText.textContent = "Both scenarios produce the same annual bathroom earnings.";
      return;
    }

    const winner = a.perYear > b.perYear ? "Scenario A" : "Scenario B";
    winnerTitle.textContent = `${winner} wins`;
    winnerText.textContent = `${winner} earns ${money(delta)} more per year during bathroom breaks.`;
  }

  [formA, formB].forEach((form) => {
    Array.from(form.elements).forEach((el) => {
      el.addEventListener("input", recalcLab);
    });
  });

  recalcLab();
}

function initRevealStagger() {
  const elements = document.querySelectorAll(".reveal");
  elements.forEach((el, idx) => {
    el.style.animationDelay = `${idx * 60}ms`;
  });
}

initRevealStagger();
initCalculatorPage();
initLabPage();

if (DEFAULT_WEEKS !== 52) {
  console.log("Weeks per year override active.");
}
