(() => {
  "use strict";

  const stage = document.getElementById("stage");
  const viewport = document.getElementById("viewport");
  const slides = [...document.querySelectorAll(".slide")];
  const currentSlideEl = document.getElementById("currentSlide");
  const totalSlidesEl = document.getElementById("totalSlides");
  const progressBar = document.getElementById("progressBar");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const overviewBtn = document.getElementById("overviewBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const overview = document.getElementById("overview");
  const overviewGrid = document.getElementById("overviewGrid");
  const closeOverview = document.getElementById("closeOverview");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let current = Math.max(0, Math.min(slides.length - 1, (Number(location.hash.slice(1)) || 1) - 1));
  let touchStartX = 0;
  let heroFrame = null;
  const initializedCharts = new Set();

  totalSlidesEl.textContent = String(slides.length).padStart(2, "0");

  function resizeStage() {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const scale = Math.min(width / 1600, height / 900);
    stage.style.setProperty("--scale", scale.toFixed(5));
    drawVisibleCanvases();
  }

  function showSlide(index, pushHash = true) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === current);
      slide.classList.toggle("was-before", i < current);
      slide.setAttribute("aria-hidden", i === current ? "false" : "true");
    });
    currentSlideEl.textContent = String(current + 1).padStart(2, "0");
    progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
    document.title = `${slides[current].dataset.title} — 20대의 생성형 AI 활용과 격차`;
    if (pushHash) history.replaceState(null, "", `#${current + 1}`);
    updateOverviewCurrent();
    drawVisibleCanvases();
  }

  function buildOverview() {
    slides.forEach((slide, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "overview-card";
      button.dataset.index = String(index);
      button.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong>${slide.dataset.title}</strong>`;
      button.addEventListener("click", () => {
        closeOverviewPanel();
        showSlide(index);
      });
      overviewGrid.appendChild(button);
    });
    updateOverviewCurrent();
  }

  function updateOverviewCurrent() {
    [...overviewGrid.children].forEach((card, i) => card.classList.toggle("is-current", i === current));
  }

  function openOverviewPanel() {
    overview.classList.add("is-open");
    overview.setAttribute("aria-hidden", "false");
    overview.querySelector(".is-current")?.focus();
  }

  function closeOverviewPanel() {
    overview.classList.remove("is-open");
    overview.setAttribute("aria-hidden", "true");
    overviewBtn.focus();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function setupCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width, height, dpr };
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
  }

  function label(ctx, text, x, y, size = 14, color = "#94a0b5", align = "left", weight = 600) {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px Pretendard, "Noto Sans KR", system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  function drawAdoptionChart() {
    const canvas = document.getElementById("adoptionChart");
    if (!canvas) return;
    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    const pad = { left: 78, right: 210, top: 34, bottom: 48 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;
    const y = value => pad.top + chartH - (value / 100) * chartH;

    [0, 20, 40, 60, 80, 100].forEach(tick => {
      ctx.strokeStyle = "rgba(255,255,255,.09)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, y(tick));
      ctx.lineTo(pad.left + chartW, y(tick));
      ctx.stroke();
      label(ctx, `${tick}%`, pad.left - 14, y(tick), 12, "#69758b", "right", 600);
    });

    const values = [35.9, 69.5];
    const years = ["2024", "2025"];
    const centers = [pad.left + chartW * .28, pad.left + chartW * .70];
    const barWidth = Math.min(150, chartW * .18);
    values.forEach((value, i) => {
      const barY = y(value);
      const gradient = ctx.createLinearGradient(0, barY, 0, pad.top + chartH);
      gradient.addColorStop(0, i === 1 ? "#4c7dff" : "#274a9d");
      gradient.addColorStop(1, i === 1 ? "rgba(76,125,255,.28)" : "rgba(39,74,157,.20)");
      roundRect(ctx, centers[i] - barWidth / 2, barY, barWidth, pad.top + chartH - barY, 9);
      ctx.fillStyle = gradient;
      ctx.fill();
      label(ctx, `${value}%`, centers[i], barY - 22, 27, i === 1 ? "#f5f7fb" : "#afbdd4", "center", 850);
      label(ctx, years[i], centers[i], pad.top + chartH + 26, 15, "#9ca8bb", "center", 750);
    });

    const awarenessY = y(84.5);
    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = "#b8ff5a";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(184,255,90,.55)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(pad.left, awarenessY);
    ctx.lineTo(pad.left + chartW, awarenessY);
    ctx.stroke();
    ctx.restore();
    label(ctx, "2025 인지율 84.5%", pad.left + chartW + 18, awarenessY, 15, "#b8ff5a", "left", 800);
  }

  function drawUseChart() {
    const canvas = document.getElementById("useChart");
    if (!canvas) return;
    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    const data = [
      { name: "정보 검색", value: 57.1, color: "#4c7dff" },
      { name: "학업", value: 24.3, color: "#48d9ff" },
      { name: "업무", value: 17.4, color: "#b8ff5a" },
      { name: "기타", value: 1.2, color: "#68758b" }
    ];
    const pad = { left: 118, right: 72, top: 28, bottom: 25 };
    const chartW = width - pad.left - pad.right;
    const row = (height - pad.top - pad.bottom) / data.length;

    [0, 20, 40, 60].forEach(tick => {
      const x = pad.left + chartW * tick / 60;
      ctx.strokeStyle = "rgba(255,255,255,.08)";
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, height - pad.bottom);
      ctx.stroke();
      label(ctx, `${tick}%`, x, 12, 11, "#657187", "center", 600);
    });

    data.forEach((item, i) => {
      const cy = pad.top + row * i + row / 2;
      const h = 28;
      label(ctx, item.name, pad.left - 18, cy, 16, "#b8c2d3", "right", 700);
      roundRect(ctx, pad.left, cy - h / 2, chartW, h, 4);
      ctx.fillStyle = "rgba(255,255,255,.045)";
      ctx.fill();
      const w = Math.max(5, chartW * item.value / 60);
      roundRect(ctx, pad.left, cy - h / 2, w, h, 4);
      ctx.fillStyle = item.color;
      ctx.fill();
      label(ctx, `${item.value}%`, Math.min(pad.left + w + 14, width - 5), cy, 18, item.color, "left", 850);
    });
  }

  function drawProductivityChart() {
    const canvas = document.getElementById("productivityChart");
    if (!canvas) return;
    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    const baseline = height * .66;
    const padX = 72;
    const items = [
      { title: "업무시간", value: "−3.8%", height: 105, color: "#48d9ff", dir: -1 },
      { title: "잠재 생산성", value: "+1.0%", height: 66, color: "#b8ff5a", dir: 1 },
      { title: "실제 생산량 상관", value: "0", height: 4, color: "#ff6b78", dir: 0 }
    ];
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, baseline);
    ctx.lineTo(width - padX, baseline);
    ctx.stroke();
    label(ctx, "기준선", padX - 8, baseline, 11, "#657187", "right", 600);

    const step = (width - padX * 2) / items.length;
    items.forEach((item, i) => {
      const x = padX + step * i + step / 2;
      const barW = Math.min(92, step * .52);
      const top = item.dir < 0 ? baseline : baseline - item.height;
      const h = item.dir < 0 ? item.height : Math.max(5, item.height);
      roundRect(ctx, x - barW / 2, top, barW, h, 7);
      ctx.fillStyle = item.color;
      ctx.globalAlpha = .82;
      ctx.fill();
      ctx.globalAlpha = 1;
      label(ctx, item.value, x, item.dir < 0 ? baseline + item.height - 18 : top - 22, 24, item.dir < 0 ? "#07101a" : item.color, "center", 850);
      label(ctx, item.title, x, height - 26, 13, "#9ca8ba", "center", 700);
    });
  }

  function drawEmploymentChart() {
    const canvas = document.getElementById("employmentChart");
    if (!canvas) return;
    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    const total = 21.1;
    const highExposure = 20.8;
    const ratio = highExposure / total;
    const cx = width / 2;
    const cy = height / 2 - 5;
    const radius = Math.min(width, height) * .31;
    const start = -Math.PI / 2;

    ctx.lineWidth = 34;
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, start + Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#ff6b78";
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(255,107,120,.35)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, start + Math.PI * 2 * ratio);
    ctx.stroke();
    ctx.shadowBlur = 0;
    label(ctx, "98.6%", cx, cy - 9, 38, "#f5f7fb", "center", 880);
    label(ctx, "감소분 중 AI 고노출 업종", cx, cy + 28, 13, "#9ca8bb", "center", 700);
    label(ctx, "AI 고노출 20.8만", cx, height - 18, 13, "#ff8c96", "center", 750);
  }

  function drawSkillsCanvas() {
    const canvas = document.getElementById("skillsCanvas");
    if (!canvas) return;
    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    const center = { x: width / 2, y: height / 2 };
    const points = [
      { x: 460, y: 108 }, { x: 745, y: 280 }, { x: 690, y: 620 }, { x: 208, y: 620 }, { x: 140, y: 280 }
    ];
    ctx.strokeStyle = "rgba(76,125,255,.24)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 8]);
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, 350, 270, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    points.forEach((point, i) => {
      const gradient = ctx.createLinearGradient(center.x, center.y, point.x, point.y);
      gradient.addColorStop(0, "rgba(184,255,90,.62)");
      gradient.addColorStop(1, "rgba(76,125,255,.18)");
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.fillStyle = i === 0 ? "#b8ff5a" : "#48d9ff";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function createNetwork(seed, width, height, count) {
    let state = seed >>> 0;
    const random = () => {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 4294967296;
    };
    return Array.from({ length: count }, () => ({
      x: width * (.48 + random() * .5),
      y: height * (.04 + random() * .92),
      r: 1.2 + random() * 2.8,
      vx: (random() - .5) * .18,
      vy: (random() - .5) * .18,
      phase: random() * Math.PI * 2
    }));
  }

  let heroNodes = [];
  function drawHero(time = 0) {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas) return;
    const { ctx, width, height } = setupCanvas(canvas);
    if (!heroNodes.length) heroNodes = createNetwork(20260816, width, height, 64);
    ctx.clearRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * .78, height * .42, 20, width * .78, height * .42, width * .42);
    glow.addColorStop(0, "rgba(76,125,255,.18)");
    glow.addColorStop(.5, "rgba(72,217,255,.05)");
    glow.addColorStop(1, "rgba(7,11,22,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    heroNodes.forEach((node, i) => {
      if (!reducedMotion) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < width * .46 || node.x > width * .99) node.vx *= -1;
        if (node.y < 10 || node.y > height - 10) node.vy *= -1;
      }
      for (let j = i + 1; j < heroNodes.length; j++) {
        const other = heroNodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 115) {
          ctx.strokeStyle = `rgba(72,217,255,${(1 - dist / 115) * .18})`;
          ctx.lineWidth = .8;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }
      const pulse = 1 + Math.sin(time * .0014 + node.phase) * .35;
      ctx.fillStyle = i % 9 === 0 ? "rgba(184,255,90,.9)" : "rgba(72,217,255,.62)";
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r * pulse, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function animateHero(time) {
    if (current === 0) drawHero(time);
    heroFrame = requestAnimationFrame(animateHero);
  }

  function drawClose() {
    const canvas = document.getElementById("closeCanvas");
    if (!canvas) return;
    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    const cx = width * .82;
    const cy = height * .19;
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(${76 + i * 5}, ${125 + i * 8}, 255, ${.22 - i * .018})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 85 + i * 37, 0, Math.PI * 2);
      ctx.stroke();
    }
    const gradient = ctx.createLinearGradient(width * .2, height, width, height * .2);
    gradient.addColorStop(0, "rgba(184,255,90,0)");
    gradient.addColorStop(1, "rgba(184,255,90,.06)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawVisibleCanvases() {
    const id = slides[current]?.querySelector("canvas")?.id;
    const drawers = {
      adoptionChart: drawAdoptionChart,
      useChart: drawUseChart,
      productivityChart: drawProductivityChart,
      employmentChart: drawEmploymentChart,
      skillsCanvas: drawSkillsCanvas,
      closeCanvas: drawClose,
      heroCanvas: () => drawHero(performance.now())
    };
    slides[current]?.querySelectorAll("canvas").forEach(canvas => {
      drawers[canvas.id]?.();
      initializedCharts.add(canvas.id);
    });
    return id;
  }

  function drawAllCanvases() {
    drawHero(performance.now());
    drawAdoptionChart();
    drawUseChart();
    drawProductivityChart();
    drawEmploymentChart();
    drawSkillsCanvas();
    drawClose();
  }

  prevBtn.addEventListener("click", () => showSlide(current - 1));
  nextBtn.addEventListener("click", () => showSlide(current + 1));
  overviewBtn.addEventListener("click", openOverviewPanel);
  closeOverview.addEventListener("click", closeOverviewPanel);
  fullscreenBtn.addEventListener("click", toggleFullscreen);

  window.addEventListener("keydown", event => {
    if (event.target instanceof HTMLAnchorElement) return;
    if (overview.classList.contains("is-open")) {
      if (event.key === "Escape" || event.key.toLowerCase() === "o") closeOverviewPanel();
      return;
    }
    const key = event.key.toLowerCase();
    if (["arrowright", "pagedown", " "].includes(key)) {
      event.preventDefault();
      showSlide(current + 1);
    } else if (["arrowleft", "pageup"].includes(key)) {
      event.preventDefault();
      showSlide(current - 1);
    } else if (key === "home") {
      event.preventDefault();
      showSlide(0);
    } else if (key === "end") {
      event.preventDefault();
      showSlide(slides.length - 1);
    } else if (key === "o") {
      openOverviewPanel();
    } else if (key === "f") {
      toggleFullscreen();
    } else if (key === "s") {
      showSlide(slides.length - 1);
    } else if (key === "escape" && document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  });

  viewport.addEventListener("pointerdown", event => { touchStartX = event.clientX; });
  viewport.addEventListener("pointerup", event => {
    const delta = event.clientX - touchStartX;
    if (Math.abs(delta) > 70) showSlide(current + (delta < 0 ? 1 : -1));
  });

  window.addEventListener("hashchange", () => {
    const index = Number(location.hash.slice(1)) - 1;
    if (Number.isInteger(index) && index >= 0 && index < slides.length) showSlide(index, false);
  });
  window.addEventListener("resize", resizeStage);
  window.addEventListener("beforeprint", drawAllCanvases);
  document.addEventListener("fullscreenchange", resizeStage);

  buildOverview();
  resizeStage();
  showSlide(current, false);
  drawAllCanvases();
  if (!reducedMotion) heroFrame = requestAnimationFrame(animateHero);
  window.addEventListener("pagehide", () => heroFrame && cancelAnimationFrame(heroFrame));
})();
