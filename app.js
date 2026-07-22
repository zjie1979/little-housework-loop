const STORAGE_KEY = "little-housework-loop-v1";
const INSTALL_TIP_KEY = "little-housework-install-tip-dismissed";
const TASK_TONES = ["peach", "honey", "sage", "lilac", "sky", "mint", "rose"];

const defaultTasks = [
  { id: "sofa-clothes", icon: "🛋️", title: "收拾沙发", detail: "拿走 5 件衣服", amount: "5 件", tone: "peach" },
  { id: "coffee-table", icon: "☕", title: "收拾茶几", detail: "归位 3 件东西", amount: "3 件", tone: "honey" },
  { id: "dining-table", icon: "🍽️", title: "收拾餐桌", detail: "归位 3 件东西", amount: "3 件", tone: "sage" },
  { id: "declutter", icon: "🧺", title: "断舍离", detail: "放下 5 件东西", amount: "5 件", tone: "lilac" },
  { id: "floor-cleaner", icon: "✨", title: "洗地机拖地", detail: "只拖 1 个小空间", amount: "1 小块", tone: "sky" },
  { id: "bay-window", icon: "🪟", title: "收拾飘窗", detail: "归位 5 件东西", amount: "5 件", tone: "mint" },
  { id: "bed-clothes", icon: "🛏️", title: "收拾床上", detail: "拿走 5 件衣服", amount: "5 件", tone: "rose" },
];

const cheerLines = [
  "家里又轻盈了一圈！",
  "小步子，也能收获大清爽。",
  "这一轮的你，行动力满格！",
  "太漂亮了，清爽正在发生。",
];

let tasks = defaultTasks.map((task) => ({ ...task }));
let completed = tasks.map(() => false);
let rounds = 0;
let celebrating = false;
let editingTaskId = null;

const elements = {
  dateLabel: document.querySelector("#date-label"),
  heroNote: document.querySelector("#hero-note"),
  roundSummary: document.querySelector("#round-summary"),
  roundSunCount: document.querySelector("#round-sun-count"),
  roundCount: document.querySelector("#round-count"),
  roundNext: document.querySelector("#round-next"),
  currentRoundLabel: document.querySelector("#current-round-label"),
  finishedCount: document.querySelector("#finished-count"),
  totalCount: document.querySelector("#total-count"),
  progressTrack: document.querySelector("#progress-track"),
  progressBar: document.querySelector("#progress-bar"),
  progressCaption: document.querySelector("#progress-caption"),
  taskList: document.querySelector("#task-list"),
  historyContent: document.querySelector("#round-history-content"),
  resetRound: document.querySelector("#reset-round"),
  customizerToggle: document.querySelector("#customizer-toggle"),
  customizerArrow: document.querySelector("#customizer-arrow"),
  customizerPanel: document.querySelector("#customizer-panel"),
  taskForm: document.querySelector("#task-form"),
  formKicker: document.querySelector("#form-kicker"),
  formTitle: document.querySelector("#form-title"),
  cancelEdit: document.querySelector("#cancel-edit"),
  taskIconInput: document.querySelector("#task-icon-input"),
  taskTitleInput: document.querySelector("#task-title-input"),
  taskDetailInput: document.querySelector("#task-detail-input"),
  taskAmountInput: document.querySelector("#task-amount-input"),
  saveTaskButton: document.querySelector("#save-task-button"),
  manageList: document.querySelector("#manage-list"),
  celebration: document.querySelector("#celebration"),
  confetti: document.querySelector("#confetti"),
  cheerKicker: document.querySelector("#cheer-kicker"),
  cheerTitle: document.querySelector("#cheer-title"),
  cheerLine: document.querySelector("#cheer-line"),
  cheerTaskCount: document.querySelector("#cheer-task-count"),
  cheerRoundCount: document.querySelector("#cheer-round-count"),
  nextRound: document.querySelector("#next-round"),
  installTip: document.querySelector("#install-tip"),
  installTipClose: document.querySelector("#install-tip-close"),
};

function isStoredTask(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.icon === "string" &&
    typeof value.title === "string" &&
    value.title.trim() &&
    typeof value.detail === "string" &&
    typeof value.amount === "string" &&
    typeof value.tone === "string",
  );
}

function normalizeStoredTasks(value) {
  if (!Array.isArray(value)) return null;
  const restored = value.filter(isStoredTask).slice(0, 30).map((task, index) => ({
    ...task,
    icon: task.icon.trim().slice(0, 8) || "🧹",
    title: task.title.trim().slice(0, 24),
    detail: task.detail.trim().slice(0, 40) || "完成这件小家务",
    amount: task.amount.trim().slice(0, 12) || "1 项",
    tone: TASK_TONES.includes(task.tone) ? task.tone : TASK_TONES[index % TASK_TONES.length],
  }));
  return restored.length ? restored : null;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      rounds,
      completed,
      tasks,
      updatedAt: new Date().toISOString(),
    }));
  } catch (_) {}
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Number.isFinite(parsed?.rounds)) {
      const restoredTasks = normalizeStoredTasks(parsed.tasks) || defaultTasks.map((task) => ({ ...task }));
      tasks = restoredTasks;
      rounds = Math.max(0, Math.floor(parsed.rounds));
      completed = Array.isArray(parsed.completed) && parsed.completed.length === tasks.length
        ? parsed.completed.map(Boolean)
        : tasks.map(() => false);
      if (completed.every(Boolean)) celebrating = true;
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

    const icon = document.createElement("span");
    icon.className = "task-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = task.icon;

    const text = document.createElement("span");
    text.className = "task-text";
    const title = document.createElement("strong");
    title.textContent = task.title;
    const detail = document.createElement("small");
    detail.textContent = isDone ? "做到了，真不错！" : task.detail;
    text.append(title, detail);

    const amount = document.createElement("span");
    amount.className = "task-amount";
    amount.textContent = task.amount;

    const check = document.createElement("span");
    check.className = "check-circle";
    check.setAttribute("aria-hidden", "true");
    check.textContent = isDone ? "✓" : "";

    button.append(icon, text, amount, check);
    button.addEventListener("click", () => toggleTask(index));
    elements.taskList.append(button);
  });
}

function renderManager() {
  elements.manageList.replaceChildren();
  const heading = document.createElement("p");
  heading.textContent = `现有清单 · ${tasks.length} 项`;
  elements.manageList.append(heading);

  tasks.forEach((task) => {
    const row = document.createElement("div");
    row.className = "manage-row";

    const icon = document.createElement("span");
    icon.className = "manage-task-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = task.icon;

    const name = document.createElement("span");
    name.className = "manage-task-name";
    const strong = document.createElement("strong");
    strong.textContent = task.title;
    const small = document.createElement("small");
    small.textContent = task.detail;
    name.append(strong, small);

    const actions = document.createElement("span");
    actions.className = "manage-actions";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "修改";
    editButton.setAttribute("aria-label", `修改${task.title}`);
    editButton.addEventListener("click", () => editTask(task.id));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "删除";
    deleteButton.setAttribute("aria-label", `删除${task.title}`);
    deleteButton.addEventListener("click", () => deleteTask(task.id));
    actions.append(editButton, deleteButton);

    row.append(icon, name, actions);
    elements.manageList.append(row);
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
  elements.heroNote.textContent = `清单里的 ${tasks.length} 件小事完成就是一轮。可以跨天慢慢完成，也可以随时自定义。`;
  elements.roundSunCount.textContent = rounds;
  elements.roundCount.textContent = rounds;
  elements.roundNext.textContent = `正在进行第 ${rounds + 1} 轮`;
  elements.currentRoundLabel.textContent = `第 ${rounds + 1} 轮`;
  elements.roundSummary.setAttribute("aria-label", `累计完成 ${rounds} 轮`);
  elements.finishedCount.textContent = finished;
  elements.totalCount.textContent = tasks.length;
  elements.progressBar.style.width = `${percent}%`;
  elements.progressTrack.setAttribute("aria-valuemax", tasks.length);
  elements.progressTrack.setAttribute("aria-valuenow", finished);
  elements.progressTrack.setAttribute("aria-label", `已完成 ${finished} 项，共 ${tasks.length} 项`);
  elements.progressCaption.textContent = finished === 0
    ? "从最顺手的一项开始吧"
    : remaining === 0
      ? "本轮全部完成"
      : `再完成 ${remaining} 项，就能收获本轮喝彩`;
  elements.resetRound.disabled = finished === 0;
  elements.customizerToggle.disabled = celebrating;
  renderTasks();
  renderManager();
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
  elements.cheerTaskCount.textContent = tasks.length;
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

function setCustomizerOpen(open) {
  elements.customizerPanel.hidden = !open;
  elements.customizerToggle.setAttribute("aria-expanded", String(open));
  elements.customizerArrow.textContent = open ? "收起" : "打开";
  if (!open) resetTaskForm();
}

function resetTaskForm() {
  editingTaskId = null;
  elements.taskIconInput.value = "🧹";
  elements.taskTitleInput.value = "";
  elements.taskDetailInput.value = "";
  elements.taskAmountInput.value = "";
  elements.formKicker.textContent = "添加一项";
  elements.formTitle.textContent = "新的小家务";
  elements.saveTaskButton.textContent = "添加到循环";
  elements.cancelEdit.hidden = true;
}

function editTask(taskId) {
  if (celebrating) return;
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;
  editingTaskId = task.id;
  setCustomizerOpen(true);
  elements.taskIconInput.value = task.icon;
  elements.taskTitleInput.value = task.title;
  elements.taskDetailInput.value = task.detail;
  elements.taskAmountInput.value = task.amount;
  elements.formKicker.textContent = "正在修改";
  elements.formTitle.textContent = "修改小家务";
  elements.saveTaskButton.textContent = "保存修改";
  elements.cancelEdit.hidden = false;
  elements.taskTitleInput.focus();
}

function saveCustomTask(event) {
  event.preventDefault();
  const title = elements.taskTitleInput.value.trim();
  if (!title) return;
  const normalized = {
    icon: elements.taskIconInput.value.trim().slice(0, 8) || "🧹",
    title: title.slice(0, 24),
    detail: elements.taskDetailInput.value.trim().slice(0, 40) || "完成这件小家务",
    amount: elements.taskAmountInput.value.trim().slice(0, 12) || "1 项",
  };

  if (editingTaskId) {
    tasks = tasks.map((task) => task.id === editingTaskId ? { ...task, ...normalized } : task);
  } else {
    if (tasks.length >= 30) {
      window.alert("最多可以设置 30 项小家务。");
      return;
    }
    tasks.push({
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...normalized,
      tone: TASK_TONES[tasks.length % TASK_TONES.length],
    });
    completed.push(false);
  }

  resetTaskForm();
  saveState();
  render();
}

function deleteTask(taskId) {
  if (celebrating) return;
  if (tasks.length === 1) {
    window.alert("至少保留 1 项小家务，才能继续循环。");
    return;
  }
  const taskIndex = tasks.findIndex((item) => item.id === taskId);
  if (taskIndex < 0) return;
  const task = tasks[taskIndex];
  if (!window.confirm(`要从清单中删除“${task.title}”吗？`)) return;

  tasks.splice(taskIndex, 1);
  completed.splice(taskIndex, 1);
  if (editingTaskId === taskId) resetTaskForm();

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
  elements.customizerToggle.addEventListener("click", () => {
    setCustomizerOpen(elements.customizerPanel.hidden);
  });
  elements.taskForm.addEventListener("submit", saveCustomTask);
  elements.cancelEdit.addEventListener("click", resetTaskForm);
  if (celebrating) showCelebration();
  if ("serviceWorker" in navigator) {
    void navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

setup();
