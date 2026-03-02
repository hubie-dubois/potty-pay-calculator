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

  const fortuneIndex = { value: -1 };
  const fortuneCountEl = document.getElementById("fortuneCount");

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
    const choice = pickNonRepeatingRandom(fortunes, fortuneIndex);
    el.textContent = choice.value;
    if (fortuneCountEl) fortuneCountEl.textContent = String(fortunes.length);
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

function initFactsPage() {
  const grid = document.getElementById("factsGrid");
  const featured = document.getElementById("featuredFact");
  const shuffleBtn = document.getElementById("shuffleFacts");
  const randomBtn = document.getElementById("randomFact");
  const posterCard = document.getElementById("posterCard");
  const posterBadge = document.getElementById("posterBadge");
  const posterTitle = document.getElementById("posterTitle");
  const posterEmoji = document.getElementById("posterEmoji");
  const posterSubtitle = document.getElementById("posterSubtitle");
  const regenArtBtn = document.getElementById("regenArt");

  if (!grid || !featured || !shuffleBtn || !randomBtn || !posterCard) return;

  const facts = [
    "The first known flushing toilet design is over 400 years old, and we still celebrate every successful flush.",
    "Your bladder sends polite warning signals first, then rapidly escalates to hostile urgency.",
    "Coffee has started more emergency bathroom sprints than most cardio programs.",
    "The office bathroom line is directly proportional to the number of people who just had iced coffee.",
    "Your gut absolutely has main-character energy after a risky burrito.",
    "The phrase 'quick bathroom break' has never been more optimistic than before opening social media.",
    "A good bathroom fan can sound like a helicopter preparing for takeoff.",
    "Humans are one of the few species that judge toilet paper quality this emotionally.",
    "You can tell a lot about a workplace by how soft the toilet paper is.",
    "Most people have a preferred stall and pretend they do not.",
    "A dramatic stomach rumble in a silent restroom is a universal character-building moment.",
    "Pee color can shift with hydration, vitamins, and your fearless commitment to energy drinks.",
    "Your colon is basically a logistics manager handling difficult deliveries.",
    "The phrase 'trust your gut' is sometimes literal and urgent.",
    "Phones have extended average bathroom break durations more than any invention since indoor plumbing.",
    "A suspiciously quiet restroom usually means someone is fighting for their life in stall three.",
    "Bidets are basically pressure washers with diplomacy.",
    "Fiber is the unsung hero of every smooth morning routine.",
    "Your digestive system can absolutely hold grudges about yesterday's food choices.",
    "The bathroom mirror has heard more pep talks than most managers.",
    "Public restroom hand dryers can sound like a tiny jet engine.",
    "Hydration is cool until your commute has no exits.",
    "The gut-brain connection explains why stress can send you speed-walking to the restroom.",
    "The workplace bathroom is a weird blend of privacy, strategy, and acoustics.",
    "There is no bolder optimism than entering a one-stall restroom with a laptop in hand.",
    "A post-meeting bathroom break is basically a system reboot.",
    "Some people can drink milk. Some people choose violence and then regret it.",
    "A good flush is one of life's most underrated victories.",
    "Morning coffee and morning bowel movements are business partners.",
    "Toilet paper orientation arguments have destroyed friendships.",
    "Cold weather can make you pee more and question your life choices.",
    "The phrase 'brb restroom' hides far more drama than it appears to.",
    "Your best ideas often arrive either in the shower or on the toilet. Science is still processing this.",
    "The longer the meeting, the more heroic the bladder control stories.",
    "A clean restroom is the closest thing to office luxury.",
    "Stomach bubbles during a quiet elevator ride are never a good omen.",
    "Hydration, fiber, and movement remain the holy trinity of bathroom harmony.",
    "You can absolutely have a favorite sink. We all do.",
    "The emergency courtesy flush is a high-skill tactical maneuver.",
    "There is no confidence like leaving a restroom knowing it smells exactly normal.",
    "The sentence 'I should not have eaten that' is usually followed by speed.",
    "Every office has one restroom everyone avoids for mysterious reasons.",
    "A well-timed bathroom break can save you from replying-all mistakes.",
    "Toilets are civilization's MVP and still somehow underappreciated.",
    "The words 'out of order' on a restroom door can trigger primal panic.",
    "Most people can identify a cheap paper towel from six feet away.",
    "A strategic restroom walk can reset your mood faster than doomscrolling.",
    "Digestive peace is priceless, but this site still calculates it in dollars.",
    "Your pee schedule on travel days is mostly controlled by traffic and bad decisions.",
    "The sound of someone aggressively unrolling toilet paper is pure cinematic tension.",
    "Nothing humbles a person faster than a bathroom with no hooks, no shelf, and no mercy.",
    "The human body is 60% water and 100% dramatic about bathroom timing."
  ];

  const factIndex = { value: -1 };
  const posterIndex = { value: -1 };
  const posterThemes = [
    {
      badge: "THRONE CERTIFIED",
      title: "Peak Flush Performance",
      emoji: "🚽⚡💩",
      subtitle: "Respect the process. Trust the flush.",
      style: "theme-a"
    },
    {
      badge: "HYDRATION DIVISION",
      title: "Pee Like A Champion",
      emoji: "💧🏆🚰",
      subtitle: "Sip water. Walk proud. Return victorious.",
      style: "theme-b"
    },
    {
      badge: "FIBER TASK FORCE",
      title: "Smooth Logistics",
      emoji: "🥦📦🚽",
      subtitle: "Gut operations running on schedule.",
      style: "theme-c"
    },
    {
      badge: "STALL CLUB",
      title: "Do Not Disturb",
      emoji: "🚪🧻🤫",
      subtitle: "Great thinking is happening in here.",
      style: "theme-d"
    },
    {
      badge: "PORCELAIN LEAGUE",
      title: "Flush, Wash, Prosper",
      emoji: "🫧👐🚽",
      subtitle: "A classic sequence for modern legends.",
      style: "theme-e"
    },
    {
      badge: "COFFEE CONSEQUENCES",
      title: "Brewed For Speed",
      emoji: "☕💨💩",
      subtitle: "Fast starts. Faster bathroom pivots.",
      style: "theme-f"
    }
  ];

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
    const shuffled = [...facts].sort(() => Math.random() - 0.5);
    renderFactCards(shuffled);
  }

  function showRandomFact() {
    const choice = pickNonRepeatingRandom(facts, factIndex);
    featured.textContent = choice.value;
  }

  function generatePoster() {
    const choice = pickNonRepeatingRandom(posterThemes, posterIndex).value;
    if (!choice) return;

    posterCard.classList.remove("theme-a", "theme-b", "theme-c", "theme-d", "theme-e", "theme-f");
    posterCard.classList.add(choice.style);
    if (posterBadge) posterBadge.textContent = choice.badge;
    if (posterTitle) posterTitle.textContent = choice.title;
    if (posterEmoji) posterEmoji.textContent = choice.emoji;
    if (posterSubtitle) posterSubtitle.textContent = choice.subtitle;
  }

  shuffleBtn.addEventListener("click", shuffleFacts);
  randomBtn.addEventListener("click", showRandomFact);
  if (regenArtBtn) regenArtBtn.addEventListener("click", generatePoster);

  shuffleFacts();
  showRandomFact();
  generatePoster();
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
initFactsPage();
