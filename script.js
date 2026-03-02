const STORAGE_KEY = "potty_pay_lifetime";
const LEADERBOARD_COOLDOWN_KEY = "potty_pay_lb_last_submit";
const Engine = window.PottyPayEngine;

const appState = {
  currentData: null,
  currentMetrics: null
};

function pickNonRepeatingRandom(items, lastIndexRef) {
  if (!items.length) return { index: -1, value: "" };
  let idx = Math.floor(Math.random() * items.length);
  if (items.length > 1) {
    while (idx === lastIndexRef.value) {
      idx = Math.floor(Math.random() * items.length);
    }
  }
  lastIndexRef.value = idx;
  return { index: idx, value: items[idx] };
}

const fortunes = [
  "The spreadsheet fears your bowel confidence.",
  "A high-value meeting will start exactly when you stand up.",
  "Today your throne ROI beats your lunch budget.",
  "Productivity tip: schedule your break before the status call.",
  "You are one flush away from financial enlightenment.",
  "A promotion may be hiding behind your next hydration break.",
  "Your inbox can wait. Your bladder cannot.",
  "Today, your restroom timing will dodge one awkward hallway chat.",
  "Your chair misses you, but your digestive system respects you.",
  "The porcelain throne sees all, judges none.",
  "A mystery snack will soon reveal its consequences.",
  "Your hourly rate and fiber intake are both trending up.",
  "You will discover a genius idea mid-handwash.",
  "Beware the espresso. Respect the espresso.",
  "A calm bathroom break will save a chaotic afternoon.",
  "Hydration now prevents desperation later.",
  "Your future self thanks you for not skipping breaks.",
  "A flush today keeps stress away.",
  "Your most profitable minute starts when the stall door closes.",
  "A random meme will improve post-break morale by 14%.",
  "Someone is in your favorite stall. Adapt and overcome.",
  "Your manager cannot measure your true throne-time efficiency.",
  "The bathroom fan hum carries ancient office wisdom.",
  "A tiny walk to the restroom will reset your brain.",
  "The meeting could have been an email, but this break is essential.",
  "A well-timed pee break prevents one regrettable Teams message.",
  "Today is a good day to trust your gut, literally.",
  "Your throne-time earnings just bought tomorrow's coffee.",
  "Your posture will improve after this strategic stroll.",
  "A sink-side pep talk is in your near future.",
  "The quarter ends, but bathroom breaks are eternal.",
  "Your best idea this week will happen near a paper towel dispenser.",
  "The restroom line shall be short and your timing immaculate.",
  "A gentle flush signals a fresh start.",
  "You are currently outperforming your own bathroom KPI.",
  "Luck favors the well-hydrated.",
  "Your digestive system has entered legendary mode.",
  "Your next break will feel suspiciously productive.",
  "Big energy. Small stall.",
  "The porcelain gods smile upon your calendar gaps."
];

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
    poopVisitsPerDay: document.getElementById("poopVisitsPerDay"),
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
  const hasTimer = Boolean(timer.clock && timer.earned && timer.meta && timer.start && timer.stop && timer.reset && timer.lifetime);


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
      poopVisitsPerDay: Engine.readNum(inputs.poopVisitsPerDay.value),
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

  function renderLifetime() {
    if (!hasTimer) return;
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

    const poopPct = data.visitsPerDay > 0 ? (data.poopVisitsPerDay / data.visitsPerDay) * 100 : 0;
    const peePct = 100 - poopPct;
    const poopYear = (metrics.perYear * poopPct) / 100;
    const peeYear = metrics.perYear - poopYear;

    output.breakdown.textContent = `${Engine.money(poopYear)} from about ${data.poopVisitsPerDay} poop visit(s)/day and ${Engine.money(peeYear)} from pee visits per year.`;
    output.poopBar.style.width = `${poopPct}%`;
    output.peeBar.style.width = `${peePct}%`;

    output.equivalents.innerHTML = "";
    Engine.annualEquivalents(metrics.perYear).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      output.equivalents.appendChild(li);
    });

    if (hasTimer) {
      timer.meta.textContent = `Earning rate while seated: ${Engine.money(metrics.perMinute)} per minute.`;
    }
  }

  function recalc() {
    const data = currentData();
    if (!Number.isFinite(data.poopVisitsPerDay) || data.poopVisitsPerDay < 0) {
      calcError.textContent = "Poop visits per workday must be 0 or greater.";
      return;
    }
    if (data.poopVisitsPerDay > data.visitsPerDay) {
      calcError.textContent = "Poop visits per workday cannot be greater than total visits per workday.";
      return;
    }

    const error = Engine.validateBase(data);
    calcError.textContent = error;
    if (error) return;

    const metrics = Engine.computeMetrics(data);
    render(metrics, data);
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
        poopVisitsPerDay: 1,
        weeksPerYear: 48
      },
      classic: {
        payType: "hourly",
        hourlyRate: 31.5,
        hoursPerWeek: 40,
        workdaysPerWeek: 5,
        minutesPerVisit: 11,
        visitsPerDay: 3,
        poopVisitsPerDay: 1,
        weeksPerYear: 50
      },
      grind: {
        payType: "salary",
        annualSalary: 115000,
        hoursPerWeek: 60,
        workdaysPerWeek: 6,
        minutesPerVisit: 14,
        visitsPerDay: 4,
        poopVisitsPerDay: 2,
        weeksPerYear: 50
      },
      chaos: {
        payType: "hourly",
        hourlyRate: 29,
        hoursPerWeek: 45,
        workdaysPerWeek: 5,
        minutesPerVisit: 9,
        visitsPerDay: 6,
        poopVisitsPerDay: 2,
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
    inputs.poopVisitsPerDay.value = String(preset.poopVisitsPerDay);
    inputs.weeksPerYear.value = String(preset.weeksPerYear);

    setPayVisibility();
    recalc();
  }

  function drawTimer() {
    if (!hasTimer) return;
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

  if (hasTimer) {
    timer.start.addEventListener("click", startTimer);
    timer.stop.addEventListener("click", stopTimer);
    timer.reset.addEventListener("click", resetTimer);
  }

  setPayVisibility();
  if (hasTimer) renderLifetime();
  recalc();
  if (hasTimer) drawTimer();

  if (hasTimer) window.addEventListener("beforeunload", stopTimer);
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
  const lbPayType = form.querySelectorAll('input[name="lbPayType"]');
  const lbHourlyWrap = document.getElementById("lbHourlyWrap");
  const lbSalaryWrap = document.getElementById("lbSalaryWrap");
  const lbHourlyRate = document.getElementById("lbHourlyRate");
  const lbAnnualSalary = document.getElementById("lbAnnualSalary");
  const lbHoursPerWeek = document.getElementById("lbHoursPerWeek");
  const lbWorkdaysPerWeek = document.getElementById("lbWorkdaysPerWeek");
  const lbMinutesPerVisit = document.getElementById("lbMinutesPerVisit");
  const lbVisitsPerDay = document.getElementById("lbVisitsPerDay");
  const lbWeeksPerYear = document.getElementById("lbWeeksPerYear");

  const hasStandaloneProfile =
    lbPayType.length > 0 &&
    lbHoursPerWeek &&
    lbWorkdaysPerWeek &&
    lbMinutesPerVisit &&
    lbVisitsPerDay &&
    lbWeeksPerYear;

  function setMessage(text) {
    if (msg) msg.textContent = text;
  }

  function getPayTypeFromForm() {
    const selected = Array.from(lbPayType).find((radio) => radio.checked);
    return selected ? selected.value : "hourly";
  }

  function togglePayTypeFields() {
    if (!hasStandaloneProfile || !lbHourlyWrap || !lbSalaryWrap) return;
    const isHourly = getPayTypeFromForm() === "hourly";
    lbHourlyWrap.classList.toggle("hidden", !isHourly);
    lbSalaryWrap.classList.toggle("hidden", isHourly);
    if (lbHourlyRate) lbHourlyRate.required = isHourly;
    if (lbAnnualSalary) lbAnnualSalary.required = !isHourly;
  }

  function readStandaloneProfile() {
    if (!hasStandaloneProfile) return null;
    const data = {
      payType: getPayTypeFromForm(),
      hourlyRate: Engine.readNum(lbHourlyRate ? lbHourlyRate.value : "0"),
      annualSalary: Engine.readNum(lbAnnualSalary ? lbAnnualSalary.value : "0"),
      hoursPerWeek: Engine.readNum(lbHoursPerWeek.value),
      workdaysPerWeek: Engine.readNum(lbWorkdaysPerWeek.value),
      minutesPerVisit: Engine.readNum(lbMinutesPerVisit.value),
      visitsPerDay: Engine.readNum(lbVisitsPerDay.value),
      weeksPerYear: Engine.readNum(lbWeeksPerYear.value)
    };
    return data;
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

    let data = null;
    if (hasStandaloneProfile) {
      data = readStandaloneProfile();
      const error = Engine.validateBase(data);
      if (error) {
        setMessage(error);
        return;
      }
    } else if (appState.currentData) {
      data = appState.currentData;
    }

    if (!data) {
      setMessage("No calculator profile found for submission.");
      return;
    }

    const metrics = Engine.computeMetrics(data);
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
    setMessage(`Submitted. Your current yearly throne income: ${Engine.money(metrics.perYear)}`);
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
  if (hasStandaloneProfile) {
    lbPayType.forEach((radio) => {
      radio.addEventListener("change", togglePayTypeFields);
    });
    togglePayTypeFields();
  }
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

function initFactsPage() {
  const grid = document.getElementById("factsGrid");
  const featured = document.getElementById("featuredFact");
  const status = document.getElementById("factsStatus");
  const factsCount = document.getElementById("factsCount");
  const categorySelect = document.getElementById("factCategory");
  const shuffleBtn = document.getElementById("shuffleFacts");
  const randomBtn = document.getElementById("randomFact");
  const shareFactBtn = document.getElementById("shareFact");
  const fortuneEl = document.getElementById("fortuneText");
  const fortuneCountEl = document.getElementById("fortuneCount");
  const fortuneBtn = document.getElementById("newFortune");

  if (!grid || !featured || !shuffleBtn || !randomBtn || !categorySelect) return;

  const facts = [
    { category: "office", text: "Most offices have one restroom everyone calls 'the good one' in hushed tones." },
    { category: "office", text: "The fastest way to clear your desk area is saying, 'brb, emergency restroom mission.'" },
    { category: "office", text: "A bathroom break right before a pointless meeting is advanced time management." },
    { category: "office", text: "Someone is definitely doing mini therapy sessions in the office restroom mirror." },
    { category: "office", text: "The best stall is never an accident. It is earned through pattern recognition." },
    { category: "office", text: "The phrase 'quick break' has no legal meaning once your phone comes out." },
    { category: "office", text: "Office bathroom acoustics can make a cough sound like a courtroom objection." },
    { category: "office", text: "The person who replaces an empty toilet roll is an unsung workplace hero." },
    { category: "office", text: "Hand dryers and conference mics share a passion for aggressive noise." },
    { category: "office", text: "A strategic restroom lap can save you from replying-all while emotional." },
    { category: "office", text: "Your favorite sink location says more about you than most personality tests." },
    { category: "office", text: "Coworkers remember who never washes hands. The gossip is permanent." },
    { category: "office", text: "A clean office restroom can boost morale more than a motivational poster." },
    { category: "office", text: "If the paper towel dispenser works on first try, buy a lottery ticket." },
    { category: "office", text: "The office bathroom is where small talk goes to die and peace is reborn." },

    { category: "coffee", text: "Coffee is not your enemy, but it definitely sends calendar invites to your colon." },
    { category: "coffee", text: "Espresso and urgency have one of the strongest partnerships in nature." },
    { category: "coffee", text: "A second cold brew before lunch is a confidence move with consequences." },
    { category: "coffee", text: "Your gut can detect latte choices faster than your taste buds can." },
    { category: "coffee", text: "Caffeine: because calm mornings are apparently overrated." },
    { category: "coffee", text: "The phrase 'just one more sip' has launched many emergency speed walks." },
    { category: "coffee", text: "Some people drink decaf. Some people race fate." },
    { category: "coffee", text: "Iced coffee in winter is proof humans enjoy complicated problems." },
    { category: "coffee", text: "Coffee does not ruin your day. It simply edits your bathroom schedule." },
    { category: "coffee", text: "A risky burrito plus cold brew is a chemistry experiment, not a lunch." },
    { category: "coffee", text: "Your mug says 'calm'. Your digestive system says 'go now'." },
    { category: "coffee", text: "There is no truer phrase than 'I should not have gotten the large'." },

    { category: "science", text: "Your bladder starts with polite reminders, then escalates like a fire alarm." },
    { category: "science", text: "Humans are about 60% water and 100% dramatic about restroom timing." },
    { category: "science", text: "Pee color can change with hydration, vitamins, and your bold snack choices." },
    { category: "science", text: "Your gut and brain are in constant group chat, and sometimes they panic together." },
    { category: "science", text: "Fiber is basically project management for your digestive timeline." },
    { category: "science", text: "Your colon is a logistics department that never gets a holiday party." },
    { category: "science", text: "Stress can send you to the restroom faster than a calendar reminder." },
    { category: "science", text: "A normal bathroom rhythm varies a lot, despite what your friend claims." },
    { category: "science", text: "Hydration helps, but drinking water 4 minutes before a road trip is still reckless." },
    { category: "science", text: "Cold weather can make some people pee more and question every life decision." },
    { category: "science", text: "Your digestive system has excellent memory for terrible food decisions." },
    { category: "science", text: "The sentence 'trust your gut' is often literal and time-sensitive." },
    { category: "science", text: "Physical movement helps digestion, even if that movement is just a nervous pace." },
    { category: "science", text: "Morning routines are the secret script behind many bathroom timelines." },

    { category: "history", text: "People engineered flushing toilets centuries ago and still celebrate every clean flush." },
    { category: "history", text: "Ancient sanitation upgrades changed public health more than most history classes mention." },
    { category: "history", text: "Toilet design has always reflected status, technology, and strong opinions." },
    { category: "history", text: "Human civilization is basically roads, plumbing, and arguing about bathroom etiquette." },
    { category: "history", text: "Public toilets are one of society's least glamorous but most important inventions." },
    { category: "history", text: "Bidets are the underappreciated innovation people discover and evangelize forever." },
    { category: "history", text: "The toilet paper roll was invented long before debates about over vs under ended." },
    { category: "history", text: "Sewer systems are the quiet infrastructure legends behind modern city life." },
    { category: "history", text: "Every era had bathroom drama. Ours just has better hashtags." },
    { category: "history", text: "Toilet humor is older than modern comedy and somehow still undefeated." }
  ];

  const factIndexByCategory = {};

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function activeCategory() {
    return categorySelect.value || "all";
  }

  function getFactsForCategory() {
    const category = activeCategory();
    if (category === "all") return facts.map((f) => f.text);
    return facts.filter((f) => f.category === category).map((f) => f.text);
  }

  function renderFactCards(shuffled) {
    grid.innerHTML = "";
    shuffled.slice(0, 9).forEach((fact) => {
      const card = document.createElement("article");
      card.className = "fact-card";
      card.innerHTML = `<p>${fact}</p>`;
      grid.appendChild(card);
    });
  }

  function shuffleFacts() {
    const source = getFactsForCategory();
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    if (factsCount) factsCount.textContent = String(source.length);
    renderFactCards(shuffled);
  }

  function showRandomFact() {
    const category = activeCategory();
    if (factIndexByCategory[category] === undefined) factIndexByCategory[category] = -1;
    const ref = { value: factIndexByCategory[category] };
    const choice = pickNonRepeatingRandom(getFactsForCategory(), ref);
    factIndexByCategory[category] = ref.value;
    featured.textContent = choice.value;
    setStatus("New random fact loaded.");
  }

  async function shareText(text, label) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        window.prompt("Copy this text:", text);
      }
      setStatus(`${label} shared/copied.`);
    } catch (error) {
      try {
        window.prompt("Copy this text:", text);
        setStatus(`${label} ready to copy.`);
      } catch (fallbackError) {
        setStatus(`Could not share ${label.toLowerCase()}.`);
      }
    }
  }

  const fortuneIndex = { value: -1 };
  function setFortune() {
    if (!fortuneEl) return;
    const choice = pickNonRepeatingRandom(fortunes, fortuneIndex);
    fortuneEl.textContent = choice.value;
    if (fortuneCountEl) fortuneCountEl.textContent = String(fortunes.length);
  }

  shuffleBtn.addEventListener("click", (event) => {
    event.preventDefault();
    shuffleFacts();
    setStatus("Facts shuffled.");
  });
  randomBtn.addEventListener("click", (event) => {
    event.preventDefault();
    showRandomFact();
  });
  categorySelect.addEventListener("change", () => {
    shuffleFacts();
    showRandomFact();
    setStatus(`Loaded ${categorySelect.options[categorySelect.selectedIndex].text}.`);
  });
  if (shareFactBtn) {
    shareFactBtn.addEventListener("click", (event) => {
      event.preventDefault();
      shareText(`Potty Fact: ${featured.textContent}`, "Fact");
    });
  }
  if (fortuneBtn) {
    fortuneBtn.addEventListener("click", (event) => {
      event.preventDefault();
      setFortune();
      setStatus("New fortune generated.");
    });
  }

  shuffleFacts();
  showRandomFact();
  setFortune();
}

function initTimerPage() {
  const form = document.getElementById("timer-form");
  if (!form || !Engine) return;

  const payTypeInputs = form.querySelectorAll('input[name="timerPayType"]');
  const hourlyWrap = document.getElementById("timerHourlyWrap");
  const salaryWrap = document.getElementById("timerSalaryWrap");
  const hourlyRate = document.getElementById("timerHourlyRate");
  const annualSalary = document.getElementById("timerAnnualSalary");
  const hoursPerWeek = document.getElementById("timerHoursPerWeek");
  const weeksPerYear = document.getElementById("timerWeeksPerYear");
  const error = document.getElementById("timerError");

  const clock = document.getElementById("timerClockStandalone");
  const earned = document.getElementById("timerEarnedStandalone");
  const meta = document.getElementById("timerMetaStandalone");
  const lifetime = document.getElementById("lifetimeTotalStandalone");
  const startBtn = document.getElementById("startTimerStandalone");
  const stopBtn = document.getElementById("stopTimerStandalone");
  const resetBtn = document.getElementById("resetTimerStandalone");

  let latestMetrics = null;
  let elapsed = 0;
  let tickId = null;

  function getPayType() {
    const selected = Array.from(payTypeInputs).find((radio) => radio.checked);
    return selected ? selected.value : "hourly";
  }

  function togglePayFields() {
    const isHourly = getPayType() === "hourly";
    hourlyWrap.classList.toggle("hidden", !isHourly);
    salaryWrap.classList.toggle("hidden", isHourly);
    hourlyRate.required = isHourly;
    annualSalary.required = !isHourly;
  }

  function currentData() {
    return {
      payType: getPayType(),
      hourlyRate: Engine.readNum(hourlyRate.value),
      annualSalary: Engine.readNum(annualSalary.value),
      hoursPerWeek: Engine.readNum(hoursPerWeek.value),
      workdaysPerWeek: 5,
      minutesPerVisit: 10,
      visitsPerDay: 1,
      weeksPerYear: Engine.readNum(weeksPerYear.value)
    };
  }

  function renderLifetime() {
    const stored = Number.parseFloat(localStorage.getItem(STORAGE_KEY) || "0");
    lifetime.textContent = `Lifetime tracked throne earnings in this browser: ${Engine.money(stored)}`;
  }

  function saveLifetime(delta) {
    const stored = Number.parseFloat(localStorage.getItem(STORAGE_KEY) || "0");
    localStorage.setItem(STORAGE_KEY, String(stored + delta));
    renderLifetime();
  }

  function drawTimer() {
    const perSecond = latestMetrics ? latestMetrics.effectiveHourly / 3600 : 0;
    clock.textContent = Engine.formatClock(elapsed);
    earned.textContent = Engine.money(elapsed * perSecond);
  }

  function recalcProfile() {
    const data = currentData();
    const valid = Engine.validateBase(data);
    error.textContent = valid;
    if (valid) return;

    latestMetrics = Engine.computeMetrics(data);
    meta.textContent = `Earning rate while seated: ${Engine.money(latestMetrics.perMinute)} per minute.`;
    drawTimer();
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
    el.addEventListener("input", recalcProfile);
    el.addEventListener("change", () => {
      togglePayFields();
      recalcProfile();
    });
  });

  startBtn.addEventListener("click", startTimer);
  stopBtn.addEventListener("click", stopTimer);
  resetBtn.addEventListener("click", resetTimer);

  togglePayFields();
  renderLifetime();
  recalcProfile();
  drawTimer();
  window.addEventListener("beforeunload", stopTimer);
}

function initRevealStagger() {
  const elements = document.querySelectorAll(".reveal");
  elements.forEach((el, idx) => {
    el.style.animationDelay = `${idx * 60}ms`;
  });
}

initRevealStagger();
initCalculatorPage();
initTimerPage();
initLeaderboard();
initLabPage();
initFactsPage();
