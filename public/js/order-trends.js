const trendsDateInput = document.getElementById("trends-date");
const trendsLimitInput = document.getElementById("trends-limit");
const trendsLoadBtn = document.getElementById("trends-load-btn");

const totalOrdersEl = document.getElementById("trend-total-orders");
const totalRevenueEl = document.getElementById("trend-total-revenue");
const busiestEl = document.getElementById("trend-busiest");
const slowestEl = document.getElementById("trend-slowest");
const topListEl = document.getElementById("trend-top-list");
const leastListEl = document.getElementById("trend-least-list");
const hourlyChartEl = document.getElementById("trend-hourly-chart");

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function renderList(element, items, emptyText) {
  if (!items || items.length === 0) {
    element.innerHTML = `<li>${emptyText}</li>`;
    return;
  }

  element.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function drawHourlyChart(hourly) {
  if (!hourlyChartEl) return;

  const ctx = hourlyChartEl.getContext("2d");
  const rect = hourlyChartEl.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;

  hourlyChartEl.width = Math.max(1, Math.floor(rect.width * scale));
  hourlyChartEl.height = Math.max(1, Math.floor(240 * scale));
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  const width = rect.width;
  const height = 240;
  const padding = { top: 18, right: 16, bottom: 34, left: 34 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const rows = Array.isArray(hourly) ? hourly : [];
  const maxOrders = Math.max(1, ...rows.map((row) => Number(row.orders || 0)));

  ctx.clearRect(0, 0, width, height);
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#475569";
  ctx.strokeStyle = "#dbe3ef";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  ctx.stroke();

  ctx.fillText(String(maxOrders), 6, padding.top + 4);
  ctx.fillText("0", 18, padding.top + chartHeight + 4);

  const gap = 3;
  const barWidth = chartWidth / 24 - gap;

  rows.forEach((row, index) => {
    const orders = Number(row.orders || 0);
    const barHeight = (orders / maxOrders) * chartHeight;
    const x = padding.left + index * (chartWidth / 24) + gap / 2;
    const y = padding.top + chartHeight - barHeight;

    ctx.fillStyle = "#4f67ff";
    ctx.fillRect(x, y, Math.max(1, barWidth), barHeight);

    if (index % 3 === 0) {
      ctx.fillStyle = "#475569";
      ctx.fillText(String(index), x, padding.top + chartHeight + 18);
    }
  });

  ctx.fillStyle = "#475569";
  ctx.fillText("Hour", padding.left + chartWidth - 28, height - 6);
}

async function loadTrends() {
  const date = trendsDateInput.value || todayString();
  const limit = Math.max(1, Number(trendsLimitInput.value) || 5);

  topListEl.innerHTML = `<li>Loading...</li>`;
  leastListEl.innerHTML = `<li>Loading...</li>`;

  try {
    const response = await fetch(
      `/api/reports/trends?date=${encodeURIComponent(date)}&limit=${limit}`
    );
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to load order trends.");
    }

    totalOrdersEl.textContent = Number(data.totalOrders);
    totalRevenueEl.textContent = money(data.totalRevenue);
    busiestEl.textContent = data.busiest || "--";
    slowestEl.textContent = data.slowest || "--";

    renderList(topListEl, data.topSelling, "No sales for this day.");
    renderList(leastListEl, data.leastSelling, "No sales for this day.");
    drawHourlyChart(data.hourly);
  } catch (error) {
    console.error(error);
    totalOrdersEl.textContent = "--";
    totalRevenueEl.textContent = "--";
    busiestEl.textContent = "--";
    slowestEl.textContent = "--";
    renderList(topListEl, [], "Failed to load.");
    renderList(leastListEl, [], "Failed to load.");
    drawHourlyChart([]);
  }
}

trendsDateInput.value = todayString();
trendsLoadBtn.addEventListener("click", loadTrends);
window.addEventListener("resize", loadTrends);
loadTrends();