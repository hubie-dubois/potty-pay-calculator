const STORAGE_KEY = "potty_pay_lifetime";
const LEADERBOARD_COOLDOWN_KEY = "potty_pay_lb_last_submit";
const Engine = window.PottyPayEngine;

const appState = {
  currentData: null,
  currentMetrics: null
};

function initCalculatorPage() {
  const form = document.getElementById("calculator-form");
  if (!form || !Engine) return;

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
      hourlyRate: Engine.readNum(inputs.hourlyRate.value),
      annualSalary: Engine.readNum(inputs.annualSalary.value),
      hoursPerWeek: Engine.readNum(inputs.hoursPerWeek.value),
      workdaysPerWeek: Engine.readNum(inputs.workdaysPerWeek.value),
      minutesPerVisit: Engine.readNum(inputs.minutesPerVisit.value),
      visitsPerDay: Engine.readNum(inputs.visitsPerDay.value),
      poopPercent: Engine.readNum(inputs.poopPercent.value),
      weeksPerYear: Engine.readNum(inputs.weeksPerYear.value)
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
    timer.lifetime.textContent = `Lifetime tracked throne earnings in this browser: ${Engine.money(stored)}`;
  }

  function saveLifetime(delta) {
    const stored = Number.parseFloat(localStorage.getItem(STORAGE_KEY) || "0");
    localStorage.setItem(STORAGE_KEY, String(stored + delta));
    renderLifetime();
  }

  function render(metrics, data) {
    latestMetrics = metrics;
    appState.currentData = data;
    appState.currentMetrics = metrics;

    output.hourly.textContent = Engine.money(metrics.effectiveHourly);
    output.visit.textContent = Engine.money(metrics.perVisit);
    output.day.textContent = Engine.money(metrics.perDay);
    output.week.textContent = Engine.money(metrics.perWeek);
    output.month.textContent = Engine.money(metrics.perMonth);
    output.year.textContent = Engine.money(metrics.perYear);

    const poopPct = clampPoopPercent(data.poopPercent);
    const peePct = 100 - poopPct;
    const poopYear = (metrics.perYear * poopPct) / 100;
    const peeYear = metrics.perYear - poopYear;

    output.breakdown.textContent = `${Engine.money(poopYear)} from poop visits and ${Engine.money(peeYear)} from pee visits per year.`;
    output.poopBar.style.width = `${poopPct}%`;
    output.peeBar.style.width = `${peePct}%`;

    output.equivalents.innerHTML = "";
    Engine.annualEquivalents(metrics.perYear).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      output.equivalents.appendChild(li);
    });

    timer.meta.textContent = `Earning rate while seated: ${Engine.money(metrics.perMinute)} per minute.`;
  }

  function recalc() {
    const data = currentData();
    const error = Engine.validateBase(data);
    calcError.textContent = error;
    if (error) return;

    const metrics = Engine.computeMetrics(data);
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
      part: {
        payType: "hourly",
        hourlyRate: 22,
        hoursPerWeek: 20,
        workdaysPerWeek: 4,
        minutesPerVisit: 8,
        visitsPerDay: 2,
        poopPercent: 30,
        weeksPerYear: 48
      },
      classic: {
        payType: "hourly",
        hourlyRate: 31.5,
        hoursPerWeek: 40,
        workdaysPerWeek: 5,
        minutesPerVisit: 11,
        visitsPerDay: 3,
        poopPercent: 35,
        weeksPerYear: 50
      },
      grind: {
        payType: "salary",
        annualSalary: 115000,
        hoursPerWeek: 60,
        workdaysPerWeek: 6,
        minutesPerVisit: 14,
        visitsPerDay: 4,
        poopPercent: 40,
        weeksPerYear: 50
      },
      chaos: {
        payType: "hourly",
        hourlyRate: 29,
        hoursPerWeek: 45,
        workdaysPerWeek: 5,
        minutesPerVisit: 9,
        visitsPerDay: 6,
        poopPercent: 28,
        weeksPerYear: 50
      }
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
    timer.clock.textContent = Engine.formatClock(elapsed);
    timer.earned.textContent = Engine.money(elapsed * perSecond);
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

function getSupabaseClient() {
  const hasLib = typeof window.supabase !== "undefined";
  const url = window.POTTY_PAY_SUPABASE_URL || "";
  const key = window.POTTY_PAY_SUPABASE_ANON_KEY || "";

  if (!hasLib || !url || !key) return null;
  return window.supabase.createClient(url, key);
}

function sanitizeName(value) {
  return String(value || "").trim().slice(0, 24);
}

function canSubmitLeaderboard() {
  const now = Date.now();
  const last = Number.parseInt(localStorage.getItem(LEADERBOARD_COOLDOWN_KEY) || "0", 10);
  return now - last >= 15000;
}

function markLeaderboardSubmitNow() {
  localStorage.setItem(LEADERBOARD_COOLDOWN_KEY, String(Date.now()));
}

function initLeaderboard() {
  const form = document.getElementById("leaderboardForm");
  const rows = document.getElementById("leaderboardRows");
  if (!form || !rows || !Engine) return;

  const msg = document.getElementById("lbMessage");
  const nameInput = document.getElementById("lbName");
  const regionInput = document.getElementById("lbRegion");
  const tabs = Array.from(document.querySelectorAll(".lb-tab"));

  const supabase = getSupabaseClient();
  let activePeriod = "all";

  function setMessage(text) {
    if (msg) msg.textContent = text;
  }

  function setRows(data) {
    if (!data.length) {
      rows.innerHTML = '<tr><td colspan="5">No entries yet. Be the first legend.</td></tr>';
      return;
    }

    rows.innerHTML = "";
    data.forEach((entry, idx) => {
      const tr = document.createElement("tr");
      const when = new Date(entry.updated_at).toLocaleDateString();
      tr.innerHTML = `<td>${idx + 1}</td><td>${entry.display_name}</td><td>${entry.region || "-"}</td><td>${Engine.money(Number(entry.score_yearly || 0))}</td><td>${when}</td>`;
      rows.appendChild(tr);
    });
  }

  async function loadLeaderboard() {
    if (!supabase) {
      rows.innerHTML = '<tr><td colspan="5">Set `POTTY_PAY_SUPABASE_URL` and `POTTY_PAY_SUPABASE_ANON_KEY` in `supabase-config.js`.</td></tr>';
      return;
    }

    let query = supabase
      .from("leaderboard_entries")
      .select("display_name,region,score_yearly,updated_at")
      .order("score_yearly", { ascending: false })
      .limit(25);

    if (activePeriod === "month") {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      query = query.gte("updated_at", start.toISOString());
    }

    const { data, error } = await query;
    if (error) {
      rows.innerHTML = `<tr><td colspan="5">Leaderboard error: ${error.message}</td></tr>`;
      return;
    }

    setRows(data || []);
  }

  async function submitEntry(event) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Supabase is not configured yet.");
      return;
    }

    if (!appState.currentData || !appState.currentMetrics) {
      setMessage("Run calculator first.");
      return;
    }

    if (!canSubmitLeaderboard()) {
      setMessage("Cooldown active. Wait 15 seconds before submitting again.");
      return;
    }

    const displayName = sanitizeName(nameInput.value);
    const region = sanitizeName(regionInput.value);

    if (displayName.length < 2) {
      setMessage("Display name must be at least 2 characters.");
      return;
    }

    const data = appState.currentData;
    const payload = {
      display_name: displayName,
      region,
      pay_type: data.payType,
      hourly_rate: Number(data.hourlyRate || 0),
      annual_salary: Number(data.annualSalary || 0),
      hours_per_week: Number(data.hoursPerWeek),
      workdays_per_week: Number(data.workdaysPerWeek),
      minutes_per_visit: Number(data.minutesPerVisit),
      visits_per_day: Number(data.visitsPerDay),
      weeks_per_year: Number(data.weeksPerYear)
    };

    setMessage("Submitting score...");

    const { error } = await supabase.from("leaderboard_entries").insert(payload);

    if (error) {
      setMessage(`Submit failed: ${error.message}`);
      return;
    }

    markLeaderboardSubmitNow();
    setMessage(`Submitted. Your current yearly throne income: ${Engine.money(appState.currentMetrics.perYear)}`);
    await loadLeaderboard();
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      activePeriod = tab.dataset.period;
      loadLeaderboard();
    });
  });

  form.addEventListener("submit", submitEntry);
  loadLeaderboard();
}

function readScenario(form) {
  if (!Engine) return null;
  return {
    payType: "hourly",
    hourlyRate: Engine.readNum(form.elements.hourlyRate.value),
    annualSalary: 0,
    hoursPerWeek: Engine.readNum(form.elements.hoursPerWeek.value),
    workdaysPerWeek: Engine.readNum(form.elements.workdaysPerWeek.value),
    minutesPerVisit: Engine.readNum(form.elements.minutesPerVisit.value),
    visitsPerDay: Engine.readNum(form.elements.visitsPerDay.value),
    weeksPerYear: Engine.readNum(form.elements.weeksPerYear.value)
  };
}

function initLabPage() {
  const formA = document.getElementById("scenarioA");
  const formB = document.getElementById("scenarioB");
  if (!formA || !formB || !Engine) return;

  const aYear = formA.querySelector("[data-year]");
  const bYear = formB.querySelector("[data-year]");
  const winnerTitle = document.getElementById("winnerTitle");
  const winnerText = document.getElementById("winnerText");
  const deltaFill = document.getElementById("deltaFill");

  function recalcLab() {
    const aData = readScenario(formA);
    const bData = readScenario(formB);

    const errA = Engine.validateBase(aData);
    const errB = Engine.validateBase(bData);

    if (errA || errB) {
      winnerTitle.textContent = "Fix invalid numbers";
      winnerText.textContent = errA || errB;
      deltaFill.style.width = "0%";
      return;
    }

    const a = Engine.computeMetrics(aData);
    const b = Engine.computeMetrics(bData);

    aYear.textContent = Engine.money(a.perYear);
    bYear.textContent = Engine.money(b.perYear);

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
    winnerText.textContent = `${winner} earns ${Engine.money(delta)} more per year during bathroom breaks.`;
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
initLeaderboard();
initLabPage();
