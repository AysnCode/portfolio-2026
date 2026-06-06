const windows = Array.from(document.querySelectorAll(".portfolio-window"));
const aboutDefaultBaseHeight = 760;
const aboutAccordionOffsets = {
  "": 0,
  "education-panel": 120,
  "experience-panel": 520,
  "softwares-panel": 120,
  "education-panel|experience-panel": 650,
  "education-panel|softwares-panel": 240,
  "experience-panel|softwares-panel": 770,
  "education-panel|experience-panel|softwares-panel": 900,
};
let aboutBaseHeight = aboutDefaultBaseHeight;
let highestZ = 10;
let dragState = null;
let resizeState = null;

function getSavedTheme() {
  try {
    const savedTheme = localStorage.getItem("portfolioTheme");
    return savedTheme === "night" ? "night" : "day";
  } catch (error) {
    return document.documentElement.dataset.theme === "night" ? "night" : "day";
  }
}

function applyTheme(theme, shouldPersist = true) {
  const nextTheme = theme === "night" ? "night" : "day";
  const toggle = document.querySelector("[data-theme-toggle]");
  const label = document.querySelector("[data-theme-label]");
  const themeColor = document.querySelector('meta[name="theme-color"]');

  document.documentElement.dataset.theme = nextTheme;
  if (themeColor) themeColor.setAttribute("content", nextTheme === "night" ? "#101214" : "#e7e8e8");
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(nextTheme === "night"));
    toggle.setAttribute("aria-label", `Switch to ${nextTheme === "night" ? "day" : "night"} mode`);
  }
  if (label) label.textContent = nextTheme === "night" ? "Night" : "Day";

  if (!shouldPersist) return;
  try {
    localStorage.setItem("portfolioTheme", nextTheme);
  } catch (error) {
    return;
  }
}

applyTheme(document.documentElement.dataset.theme || getSavedTheme(), false);

function updateLocalClock() {
  const clockWidget = document.querySelector(".time-widget");
  const monthTarget = document.querySelector("[data-clock-month]");
  const dateTarget = document.querySelector("[data-clock-date]");
  const yearTarget = document.querySelector("[data-clock-year]");
  const hourTarget = document.querySelector("[data-clock-hour]");
  const minuteTarget = document.querySelector("[data-clock-minute]");
  const periodTarget = document.querySelector("[data-clock-period]");
  const weekdayTarget = document.querySelector("[data-clock-weekday]");
  if (
    !clockWidget ||
    !monthTarget ||
    !dateTarget ||
    !yearTarget ||
    !hourTarget ||
    !minuteTarget ||
    !periodTarget ||
    !weekdayTarget
  ) {
    return;
  }

  const now = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local timezone";
  clockWidget.dataset.timeZone = timeZone;

  const hours = now.getHours();
  const twelveHour = hours % 12 || 12;
  const weekday = new Intl.DateTimeFormat([], { weekday: "short" }).format(now);

  monthTarget.textContent = new Intl.DateTimeFormat([], { month: "short" }).format(now).toUpperCase();
  dateTarget.textContent = String(now.getDate()).padStart(2, "0");
  yearTarget.textContent = String(now.getFullYear());
  hourTarget.textContent = String(twelveHour).padStart(2, "0");
  minuteTarget.textContent = String(now.getMinutes()).padStart(2, "0");
  periodTarget.textContent = hours >= 12 ? "PM" : "AM";
  weekdayTarget.textContent = weekday.toUpperCase();
}

updateLocalClock();
setInterval(updateLocalClock, 1000);

const snakePreview = (() => {
  const widget = document.querySelector(".snake-preview-widget");
  const board = document.querySelector("[data-snake-preview]");
  if (!widget || !board) return null;

  const ctx = board.getContext("2d");
  const cells = 12;
  const cellSize = board.width / cells;
  const path = [];

  for (let x = 2; x <= 9; x += 1) path.push({ x, y: 2 });
  for (let y = 3; y <= 9; y += 1) path.push({ x: 9, y });
  for (let x = 8; x >= 2; x -= 1) path.push({ x, y: 9 });
  for (let y = 8; y >= 3; y -= 1) path.push({ x: 2, y });

  let pathIndex = 5;
  let foodPathIndex = 10;
  let timer = null;
  let isPaused = false;

  function drawCell(cell, color) {
    ctx.fillStyle = color;
    ctx.fillRect(cell.x * cellSize + 2, cell.y * cellSize + 2, cellSize - 4, cellSize - 4);
  }

  function draw() {
    const styles = getComputedStyle(document.documentElement);
    const boardBackground = styles.getPropertyValue("--widget-bg").trim();
    const gridColor = styles.getPropertyValue("--snake-grid").trim();
    const snakeHead = styles.getPropertyValue("--snake-head").trim();
    const snakeBody = styles.getPropertyValue("--snake-body").trim();

    ctx.fillStyle = boardBackground;
    ctx.fillRect(0, 0, board.width, board.height);
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    for (let i = 1; i < cells; i += 1) {
      const line = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(line, 0);
      ctx.lineTo(line, board.height);
      ctx.moveTo(0, line);
      ctx.lineTo(board.width, line);
      ctx.stroke();
    }

    for (let i = 7; i >= 0; i -= 1) {
      const segment = path[(pathIndex - i + path.length) % path.length];
      drawCell(segment, i === 0 ? snakeHead : snakeBody);
    }

    drawCell(path[foodPathIndex], "#d41217");
  }

  function placeFood() {
    const minAhead = 5;
    const maxAhead = Math.max(minAhead, path.length - 10);
    const offset = minAhead + Math.floor(Math.random() * (maxAhead - minAhead + 1));
    foodPathIndex = (pathIndex + offset) % path.length;
  }

  function tick() {
    if (isPaused) return;
    pathIndex = (pathIndex + 1) % path.length;
    if (pathIndex === foodPathIndex) placeFood();
    draw();
  }

  function pause() {
    isPaused = true;
  }

  function resume() {
    isPaused = false;
  }

  widget.addEventListener("pointerenter", pause);
  widget.addEventListener("pointerleave", resume);
  widget.addEventListener("focus", pause);
  widget.addEventListener("blur", resume);

  placeFood();
  draw();
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    timer = window.setInterval(tick, 150);
  }

  return {
    redraw: draw,
    stop() {
      if (timer) window.clearInterval(timer);
    },
  };
})();

const snakeGame = (() => {
  const board = document.querySelector("[data-snake-board]");
  const scoreTarget = document.querySelector("[data-snake-score]");
  const statusTarget = document.querySelector("[data-snake-status]");
  const restartButton = document.querySelector("[data-snake-restart]");
  if (!board || !scoreTarget || !statusTarget || !restartButton) return null;

  const ctx = board.getContext("2d");
  const cells = 20;
  const cellSize = board.width / cells;
  const directions = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };
  let snake = [];
  let food = { x: 14, y: 10 };
  let direction = directions.ArrowRight;
  let nextDirection = direction;
  let score = 0;
  let timer = null;
  let isGameOver = false;

  function drawCell(cell, color) {
    ctx.fillStyle = color;
    ctx.fillRect(cell.x * cellSize + 1, cell.y * cellSize + 1, cellSize - 2, cellSize - 2);
  }

  function draw() {
    const styles = getComputedStyle(document.documentElement);
    const boardBackground = styles.getPropertyValue("--snake-board-bg").trim();
    const gridColor = styles.getPropertyValue("--snake-grid").trim();
    const snakeHead = styles.getPropertyValue("--snake-head").trim();
    const snakeBody = styles.getPropertyValue("--snake-body").trim();

    ctx.fillStyle = boardBackground;
    ctx.fillRect(0, 0, board.width, board.height);

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 1; i < cells; i += 1) {
      const line = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(line, 0);
      ctx.lineTo(line, board.height);
      ctx.moveTo(0, line);
      ctx.lineTo(board.width, line);
      ctx.stroke();
    }

    drawCell(food, "#d41217");
    snake.forEach((segment, index) => {
      drawCell(segment, index === 0 ? snakeHead : snakeBody);
    });
  }

  function placeFood() {
    do {
      food = {
        x: Math.floor(Math.random() * cells),
        y: Math.floor(Math.random() * cells),
      };
    } while (snake.some((segment) => segment.x === food.x && segment.y === food.y));
  }

  function setStatus(status) {
    statusTarget.textContent = status;
  }

  function reset() {
    snake = [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 },
    ];
    direction = directions.ArrowRight;
    nextDirection = direction;
    score = 0;
    isGameOver = false;
    scoreTarget.textContent = String(score);
    placeFood();
    setStatus("Ready");
    draw();
  }

  function stop(status) {
    if (timer) window.clearInterval(timer);
    timer = null;
    if (status) setStatus(status);
  }

  function endGame() {
    isGameOver = true;
    stop("Game over");
  }

  function tick() {
    direction = nextDirection;
    const head = snake[0];
    const nextHead = {
      x: head.x + direction.x,
      y: head.y + direction.y,
    };

    const hitWall = nextHead.x < 0 || nextHead.x >= cells || nextHead.y < 0 || nextHead.y >= cells;
    const hitSnake = snake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);
    if (hitWall || hitSnake) {
      endGame();
      draw();
      return;
    }

    snake.unshift(nextHead);
    if (nextHead.x === food.x && nextHead.y === food.y) {
      score += 1;
      scoreTarget.textContent = String(score);
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function start() {
    if (isGameOver) reset();
    if (!timer) {
      setStatus("Playing");
      timer = window.setInterval(tick, 120);
    }
    board.focus({ preventScroll: true });
  }

  function turn(key) {
    const requestedDirection = directions[key];
    if (!requestedDirection) return;
    const isReverse =
      requestedDirection.x + direction.x === 0 && requestedDirection.y + direction.y === 0;
    if (!isReverse) nextDirection = requestedDirection;
    start();
  }

  restartButton.addEventListener("click", () => {
    reset();
    start();
  });

  reset();

  return {
    redraw: draw,
    start,
    stop,
    turn,
  };
})();

function focusWindow(win) {
  windows.forEach((item) => item.classList.remove("is-focused"));
  win.classList.add("is-focused", "is-open");
  win.style.zIndex = String(++highestZ);
}

function getViewportSize() {
  const viewport = window.visualViewport;
  return {
    width: Math.max(240, viewport?.width || window.innerWidth),
    height: Math.max(240, viewport?.height || window.innerHeight),
  };
}

function syncViewportCssVars() {
  const viewport = getViewportSize();
  document.documentElement.style.setProperty("--visual-viewport-height", `${Math.floor(viewport.height)}px`);
  document.documentElement.style.setProperty("--visual-viewport-width", `${Math.floor(viewport.width)}px`);
}

function usesMobileWindowLayout() {
  return window.matchMedia("(max-width: 680px), (max-height: 560px) and (orientation: landscape)").matches;
}

function disablesWindowGestures() {
  return window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
}

function constrainWindowToViewport(win) {
  if (!win.classList.contains("is-open")) return;

  if (usesMobileWindowLayout()) {
    win.style.removeProperty("left");
    win.style.removeProperty("top");
    win.style.removeProperty("width");
    win.style.removeProperty("height");
    return;
  }

  const viewport = getViewportSize();
  const rect = win.getBoundingClientRect();
  const gutter = 14;
  const maxWidth = Math.max(240, viewport.width - gutter * 2);
  const maxHeight = Math.max(230, viewport.height - gutter * 2);
  const width = Math.min(rect.width, maxWidth);
  const height = Math.min(rect.height, maxHeight);
  const left = clamp(rect.left, gutter, Math.max(gutter, viewport.width - width - gutter));
  const top = clamp(rect.top, gutter, Math.max(gutter, viewport.height - 46));

  if (rect.width > maxWidth) win.style.width = `${Math.floor(maxWidth)}px`;
  if (rect.height > maxHeight) win.style.height = `${Math.floor(maxHeight)}px`;
  win.style.left = `${Math.floor(left)}px`;
  win.style.top = `${Math.floor(top)}px`;
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  focusWindow(win);
  if (win.classList.contains("work-case-window")) {
    const viewport = getViewportSize();
    win.style.left = "14px";
    win.style.top = "14px";
    win.style.width = `${Math.max(240, viewport.width - 28)}px`;
    win.style.height = `${Math.max(230, viewport.height - 28)}px`;
    win.querySelectorAll(".work-case-study").forEach((project) => {
      project.hidden = true;
      project.classList.remove("is-revealed");
    });
    win.querySelectorAll(".work-project-card").forEach((card) => card.classList.remove("is-active"));
    win.querySelector(".window-content")?.scrollTo({ top: 0 });
  }
  if (win.classList.contains("resume-window")) {
    requestAnimationFrame(() => resizeAboutWindowByAccordionState(win));
  }
  if (win.classList.contains("snake-window")) {
    requestAnimationFrame(() => snakeGame?.start());
  }
  requestAnimationFrame(() => constrainWindowToViewport(win));
}

function getResizeBounds(win) {
  const viewport = getViewportSize();
  const rect = win.getBoundingClientRect();
  const baseMinWidth = Math.min(360, viewport.width - 28);
  const baseMinHeight = 230;
  const maxWidth = Math.max(baseMinWidth, viewport.width - rect.left - 14);
  const maxHeight = Math.max(baseMinHeight, viewport.height - rect.top - 14);
  const bounds = {
    minWidth: baseMinWidth,
    minHeight: baseMinHeight,
    maxWidth,
    maxHeight,
  };

  if (win.classList.contains("resume-window")) {
    bounds.minWidth = Math.min(460, viewport.width - 28);
    bounds.minHeight = Math.min(560, maxHeight);
    bounds.maxWidth = Math.min(maxWidth, Math.max(bounds.minWidth, 640));
  }

  if (win.classList.contains("brands-window")) {
    bounds.minWidth = Math.min(620, viewport.width - 28);
    bounds.minHeight = Math.min(340, maxHeight);
  }

  return bounds;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function getOpenAccordionKey(win) {
  return Array.from(win.querySelectorAll("[data-accordion-toggle]"))
    .filter((toggle) => toggle.getAttribute("aria-expanded") === "true")
    .map((toggle) => toggle.getAttribute("aria-controls"))
    .join("|");
}

function getAboutAccordionOffset(win) {
  return aboutAccordionOffsets[getOpenAccordionKey(win)] || 0;
}

function resizeAboutWindowByAccordionState(win) {
  if (usesMobileWindowLayout()) {
    win.style.removeProperty("height");
    win.style.removeProperty("top");
    return;
  }

  const targetHeight = aboutBaseHeight + getAboutAccordionOffset(win);
  const rect = win.getBoundingClientRect();
  const viewport = getViewportSize();

  if (targetHeight > viewport.height - rect.top - 14) {
    win.style.top = `${Math.max(14, viewport.height - targetHeight - 14)}px`;
  }

  const bounds = getResizeBounds(win);
  const nextHeight = clamp(targetHeight, bounds.minHeight, bounds.maxHeight);
  win.style.height = `${Math.ceil(nextHeight)}px`;
}

function rememberAboutBaseHeight(win) {
  const bounds = getResizeBounds(win);
  const currentHeight = win.getBoundingClientRect().height;
  const nextBaseHeight = currentHeight - getAboutAccordionOffset(win);
  aboutBaseHeight = clamp(nextBaseHeight, aboutDefaultBaseHeight, bounds.maxHeight);
}

document.querySelectorAll("[data-open-window]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    openWindow(trigger.dataset.openWindow);
  });
});

document.querySelectorAll("[data-download-resume]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const resumeUrl = trigger.dataset.resumeUrl;
    if (!resumeUrl) return;
    const shouldDownload = window.confirm("Would you like to download a copy of Aaron Yuson's resume?");
    if (!shouldDownload) return;

    const link = document.createElement("a");
    link.href = resumeUrl;
    link.download = "Aaron_Yuson_Resume_2026.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
});

document.querySelectorAll("[data-theme-toggle]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const currentTheme = document.documentElement.dataset.theme === "night" ? "night" : "day";
    applyTheme(currentTheme === "night" ? "day" : "night");
    snakePreview?.redraw();
    snakeGame?.redraw();
  });
});

document.querySelectorAll("[data-snake-direction]").forEach((control) => {
  control.addEventListener("click", () => {
    snakeGame?.turn(control.dataset.snakeDirection);
  });
});

document.addEventListener("keydown", (event) => {
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
  const snakeWindow = document.getElementById("snakeWindow");
  if (!snakeWindow?.classList.contains("is-open")) return;
  event.preventDefault();
  snakeGame?.turn(event.key);
});

document.querySelectorAll("[data-accordion-toggle]").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const panel = document.getElementById(toggle.getAttribute("aria-controls"));
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isExpanded));
    if (panel) panel.hidden = isExpanded;
    const win = toggle.closest(".resume-window");
    if (win) requestAnimationFrame(() => resizeAboutWindowByAccordionState(win));
  });
});

document.querySelectorAll("[data-contact-form]").forEach((form) => {
  const openedAt = Date.now();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const submitButton = form.querySelector(".contact-submit");
    const status = form.querySelector("[data-contact-status]");
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      website: String(formData.get("website") || "").trim(),
      elapsed: Date.now() - openedAt,
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }
    if (status) {
      status.className = "contact-form-status";
      status.textContent = "Sending your message...";
    }

    try {
      const response = await fetch("https://formsubmit.co/ajax/aaron.matthewyuson@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          subject: payload.subject,
          message: payload.message,
          _subject: `[Portfolio] ${payload.subject}`,
          _replyto: payload.email,
          _template: "table",
          _captcha: "false",
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (result.success === "false" && /needs activation/i.test(result.message || "")) {
        throw new Error("The contact form is awaiting owner activation.");
      }

      if (!response.ok) {
        throw new Error(result.error || "Your message could not be sent.");
      }

      if (result.success === "false") {
        throw new Error(result.message || "Your message could not be sent.");
      }

      form.reset();
      if (status) {
        status.className = "contact-form-status is-success";
        status.textContent = "Message sent. Thank you for reaching out.";
      }
    } catch (error) {
      if (status) {
        status.className = "contact-form-status is-error";
        status.textContent = error.message || "Something went wrong. Please try again.";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send";
      }
    }
  });
});

document.querySelectorAll(".model-thumb").forEach((thumb) => {
  thumb.addEventListener("click", () => {
    const viewer = document.querySelector("[data-model-viewer]");
    const title = document.querySelector("[data-model-title]");
    if (!viewer || !thumb.dataset.modelSrc) return;

    document.querySelectorAll(".model-thumb").forEach((item) => item.classList.remove("is-active"));
    thumb.classList.add("is-active");
    viewer.setAttribute("src", thumb.dataset.modelSrc);
    viewer.setAttribute("alt", thumb.dataset.modelAlt || `${thumb.dataset.modelName || "Selected"} 3D model`);
    if (title) title.textContent = thumb.dataset.modelName || "3D Model";
  });
});

document.querySelectorAll(".work-project-card").forEach((card) => {
  card.addEventListener("click", (event) => {
    const target = document.querySelector(card.getAttribute("href"));
    const content = card.closest(".window-content");
    if (!target || !content) return;
    event.preventDefault();
    content.querySelectorAll(".work-case-study").forEach((project) => {
      project.hidden = true;
      project.classList.remove("is-revealed");
    });
    content.querySelectorAll(".work-project-card").forEach((item) => item.classList.remove("is-active"));
    card.classList.add("is-active");
    target.hidden = false;
    target.classList.remove("is-revealed");
    requestAnimationFrame(() => {
      target.classList.add("is-revealed");
      content.scrollTo({
        top: target.offsetTop - content.offsetTop,
        behavior: "smooth",
      });
    });
  });
});

windows.forEach((win) => {
  const titlebar = win.querySelector(".window-titlebar");
  ["right", "bottom", "corner"].forEach((position) => {
    const handle = document.createElement("span");
    handle.className = `resize-handle ${position}`;
    handle.setAttribute("aria-hidden", "true");
    win.appendChild(handle);
  });

  win.addEventListener("pointerdown", () => focusWindow(win));

  win.querySelector("[data-close-window]").addEventListener("click", (event) => {
    event.stopPropagation();
    win.classList.remove("is-open", "is-focused");
    if (win.classList.contains("snake-window")) snakeGame?.stop("Paused");
  });

  titlebar.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    if (disablesWindowGestures()) return;
    const rect = win.getBoundingClientRect();
    dragState = {
      win,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    titlebar.setPointerCapture(event.pointerId);
    focusWindow(win);
  });

  titlebar.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.win !== win) return;
    const viewport = getViewportSize();
    const nextX = event.clientX - dragState.offsetX;
    const nextY = event.clientY - dragState.offsetY;
    const maxX = viewport.width - Math.min(win.offsetWidth, viewport.width - 24);
    const maxY = viewport.height - 52;
    win.style.left = `${Math.max(12, Math.min(nextX, maxX))}px`;
    win.style.top = `${Math.max(12, Math.min(nextY, maxY))}px`;
  });

  titlebar.addEventListener("pointerup", () => {
    dragState = null;
  });

  titlebar.addEventListener("pointercancel", () => {
    dragState = null;
  });

  win.querySelectorAll(".resize-handle").forEach((handle) => {
    handle.addEventListener("pointerdown", (event) => {
      if (disablesWindowGestures()) return;
      event.stopPropagation();
      const rect = win.getBoundingClientRect();
      resizeState = {
        win,
        edge: handle.classList.contains("corner") ? "corner" : handle.classList.contains("right") ? "right" : "bottom",
        startX: event.clientX,
        startY: event.clientY,
        width: rect.width,
        height: rect.height,
      };
      handle.setPointerCapture(event.pointerId);
      focusWindow(win);
    });

    handle.addEventListener("pointermove", (event) => {
      if (!resizeState || resizeState.win !== win) return;
      const deltaX = event.clientX - resizeState.startX;
      const deltaY = event.clientY - resizeState.startY;
      const canResizeX = resizeState.edge === "right" || resizeState.edge === "corner";
      const canResizeY = resizeState.edge === "bottom" || resizeState.edge === "corner";
      const bounds = getResizeBounds(win);
      let nextWidth = resizeState.width;
      let nextHeight = resizeState.height;

      if (canResizeX) {
        nextWidth = clamp(resizeState.width + deltaX, bounds.minWidth, bounds.maxWidth);
      }
      if (canResizeY) {
        nextHeight = clamp(resizeState.height + deltaY, bounds.minHeight, bounds.maxHeight);
      }

      if (win.classList.contains("brands-window")) {
        const maxLandscapeHeight = Math.max(bounds.minHeight, nextWidth * 0.72);
        nextHeight = Math.min(nextHeight, maxLandscapeHeight);
      }

      if (canResizeX) win.style.width = `${nextWidth}px`;
      if (canResizeY || win.classList.contains("brands-window")) win.style.height = `${nextHeight}px`;
    });

    handle.addEventListener("pointerup", () => {
      if (
        resizeState &&
        resizeState.win === win &&
        win.classList.contains("resume-window") &&
        (resizeState.edge === "bottom" || resizeState.edge === "corner")
      ) {
        rememberAboutBaseHeight(win);
        resizeAboutWindowByAccordionState(win);
      }
      resizeState = null;
    });

    handle.addEventListener("pointercancel", () => {
      resizeState = null;
    });
  });
});

function constrainOpenWindows() {
  syncViewportCssVars();
  windows.forEach((win) => constrainWindowToViewport(win));
}

syncViewportCssVars();
window.addEventListener("resize", constrainOpenWindows);
window.visualViewport?.addEventListener("resize", constrainOpenWindows);
window.visualViewport?.addEventListener("scroll", constrainOpenWindows);
