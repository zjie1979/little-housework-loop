const STORAGE_KEY = "little-housework-loop-v1";
const INSTALL_TIP_KEY = "little-housework-install-tip-dismissed";

const tasks = [
  { icon: "🛋️", title: "收拾沙发", detail: "拿走 5 件衣服", amount: "5 件", tone: "peach" },
  { icon: "☕", title: "收拾茶几", detail: "归位 3 件东西", amount: "3 件", tone: "honey" },
  { icon: "🍽️", title: "收拾餐桌", detail: "归位 3 件东西", amount: "3 件", tone: "sage" },
  { icon: "🧺", title: "断舍离", detail: "放下 5 件东西", amount: "5 件", tone: "lilac" },
  { icon: "✨", title: "洗地机拖地", detail: "只拖 1 个小空间", amount: "1 小块", tone: "sky" },
  { icon: "🪟", title: "收拾飘窗", detail: "归位 5 件东西", amount: "5 件", tone: "mint" },
  { icon: "🛏️", title: "收拾床上", detail: "拿走 5 件衣服", amount: "5 件", tone: "rose" },
];

const cheerLines = [
  "家里又轻盈了一圈！",
  "小步子，也能收获大清爽。",
  "这一轮的你，行动力满格！",
  "太漂亮了，清爽正在发生。",
];

let completed = tasks.map(() => false);
let rounds = 0;
let celebrating = false;

const elements = {
  dateLabel: document.querySelector("#date-label"),
  roundSummary: document.querySelector("#round-summary"),
  roundSunCount: document.querySelector("#round-sun-count"),
  roundCount: document.querySelector("#round-count"),
  roundNext: document.querySelector("#round-next"),
  currentRoundLabel: document.querySelector("#current-round-label"),
  finishedCount: document.querySelector("#finished-count"),
  progressTrack: document.querySelector("#progress-track"),
  progressBar: document.querySelector("#progress-bar"),
  progressCaption: document.querySelector("#progress-caption"),
  taskList: document.querySelector("#task-list"),
  historyContent: document.querySelector("#round-history-content"),
  resetRound: document.querySelector("#reset-round"),
  celebration: document.querySelector("#celebration"),
  confetti: document.querySelector("#confetti"),
  cheerKicker: document.querySelector("#cheer-kicker"),
  cheerTitle: document.querySelector("#cheer-title"),
  cheerLine: document.querySelector("#cheer-line"),
  cheerRoundCount: document.querySelector("#cheer-round-count"),
  nextRound: document.querySelector("#next-round"),
  installTip: document.querySelector("#install-tip"),
  installTipClose: document.querySelector("#install-tip-close"),
};

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      rounds,
      completed,
      updatedAt: new Date().toISOString(),
    }));
  } catch (_) {}
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (
      Number.isFinite(parsed?.rounds) &&
      Array.isArray(parsed.completed) &&
      parsed.completed.length === tasks.length
    ) {
      rounds = Math.max(0, Math.floor(parsed.rounds));
      completed = parsed.completed.map(Boolean);
    }
  } catch (_) {}
}

function playCheer() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audio = new AudioContextClass();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const start = audio.currentTime;
    notes.forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start + index * 0.1);
      gain.gain.linearRampToValueAtTime(0.12, start + index * 0.1 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, start + index * 0.1 + 0.34);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(start + index * 0.1);
      oscillator.stop(start + index * 0.1 + 0.36);
    });
    window.setTimeout(() => void audio.close(), 1100);
  } catch (_) {}
}

function renderTasks() {
  elements.taskList.replaceChildren();
  tasks.forEach((task, index) => {
    const isDone = completed[index];
    const button = document.createElement("button");
    button.type = "button";
    button.className = `task-card ${task.tone}${isDone ? " is-done" : ""}`;
    button.setAttribute("aria-pressed", String(isDone));
    button.setAttribute("aria-label", `${task.title}，${task.detail}，${isDone ? "已完成，点击取消" : "未完成，点击打卡"}`);
    button.innerHTML = `
      <span class="task-icon" aria-hidden="true">${task.icon}</span>
      <span class="task-text"><strong>${task.title}</strong><small>${isDone ? "做到了，真不错！" : task.detail}</small></span>
      <span class="task-amount">${task.amount}</span>
      <span class="check-circle" aria-hidden="true">${isDone ? "✓" : ""}</span>`;
    button.addEventListener("click", () => toggleTask(index));
    elements.taskList.append(button);
  });
}

function renderHistory() {
  elements.historyContent.replaceChildren();
  if (rounds === 0) {
    const message = document.createElement("p");
    message.textContent = "第一枚小太阳，正在等你点亮。";
    elements.historyContent.append(message);
    return;
  }
  const badges = document.createElement("div");
  badges.className = "round-badges";
  for (let index = 0; index < rounds; index += 1) {
    const badge = document.createElement("span");
    badge.title = `第 ${index + 1} 轮已完成`;
    badge.innerHTML = `<b>${index + 1}</b>✓`;
    badges.append(badge);
  }
  elements.historyContent.append(badges);
}

function render() {
  const finished = completed.filter(Boolean).length;
  const remaining = tasks.length - finished;
  const percent = Math.round((finished / tasks.length) * 100);
  elements.roundSunCount.textContent = rounds;
  elements.roundCount.textContent = rounds;
  elements.roundNext.textContent = `正在进行第 ${rounds + 1} 轮`;
  elements.currentRoundLabel.textContent = `第 ${rounds + 1} 轮`;
  elements.roundSummary.setAttribute("aria-label", `累计完成 ${rounds} 轮`);
  elements.finishedCount.textContent = finished;
  elements.progressBar.style.width = `${percent}%`;
  elements.progressTrack.setAttribute("aria-valuenow", finished);
  elements.progressTrack.setAttribute("aria-label", `已完成 ${finished} 项，共 ${tasks.length} 项`);
  elements.progressCaption.textContent = finished === 0
    ? "从最顺手的一项开始吧"
    : remaining === 0
      ? "本轮全部完成"
      : `再完成 ${remaining} 项，就能收获本轮喝彩`;
  elements.resetRound.disabled = finished === 0;
  renderTasks();
  renderHistory();
}

function toggleTask(index) {
  if (celebrating) return;
  completed[index] = !completed[index];
  if (completed.every(Boolean)) {
    rounds += 1;
    celebrating = true;
    saveState();
    render();
    showCelebration();
    playCheer();
    navigator.vibrate?.([90, 50, 140]);
    return;
  }
  saveState();
  render();
}

function createConfetti() {
  const colors = ["#f48755", "#ffd368", "#69a988", "#9e87d1", "#ef7490"];
  elements.confetti.replaceChildren();
  for (let index = 0; index < 30; index += 1) {
    const piece = document.createElement("i");
    piece.style.setProperty("--left", `${(index * 37) % 100}%`);
    piece.style.setProperty("--delay", `${(index % 8) * 0.08}s`);
    piece.style.setProperty("--duration", `${1.9 + (index % 5) * 0.2}s`);
    piece.style.setProperty("--color", colors[index % colors.length]);
    piece.style.setProperty("--turn", `${(index % 2 === 0 ? 1 : -1) * (220 + index * 11)}deg`);
    elements.confetti.append(piece);
  }
}

function showCelebration() {
  const line = cheerLines[(Math.max(rounds, 1) - 1) % cheerLines.length];
  elements.cheerKicker.textContent = `ROUND ${rounds} COMPLETE`;
  elements.cheerTitle.textContent = `第 ${rounds} 轮，完成啦！`;
  elements.cheerLine.textContent = line;
  elements.cheerRoundCount.textContent = rounds;
  elements.nextRound.innerHTML = `开启第 ${rounds + 1} 轮 <span aria-hidden="true">→</span>`;
  createConfetti();
  elements.celebration.hidden = false;
  elements.nextRound.focus();
}

function beginNextRound() {
  completed = tasks.map(() => false);
  celebrating = false;
  elements.celebration.hidden = true;
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetCurrentRound() {
  if (!completed.some(Boolean)) return;
  if (window.confirm("要取消本轮已经勾选的项目吗？累计完成轮数会保留。")) {
    completed = tasks.map(() => false);
    saveState();
    render();
  }
}

function setupInstallTip() {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
  let dismissed = false;
  try { dismissed = localStorage.getItem(INSTALL_TIP_KEY) === "yes"; } catch (_) {}
  elements.installTip.hidden = !(isIos && !isStandalone && !dismissed);
  elements.installTipClose.addEventListener("click", () => {
    elements.installTip.hidden = true;
    try { localStorage.setItem(INSTALL_TIP_KEY, "yes"); } catch (_) {}
  });
}

function setup() {
  elements.dateLabel.textContent = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
  loadState();
  render();
  setupInstallTip();
  elements.nextRound.addEventListener("click", beginNextRound);
  elements.resetRound.addEventListener("click", resetCurrentRound);
  if ("serviceWorker" in navigator) {
    void navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

setup();
