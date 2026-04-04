const trendsDateInput = document.getElementById("trends-date");
const trendsLimitInput = document.getElementById("trends-limit");
const trendsLoadBtn = document.getElementById("trends-load-btn");

const totalOrdersEl = document.getElementById("trend-total-orders");
const totalRevenueEl = document.getElementById("trend-total-revenue");
const busiestEl = document.getElementById("trend-busiest");
const slowestEl = document.getElementById("trend-slowest");
const topListEl = document.getElementById("trend-top-list");
const leastListEl = document.getElementById("trend-least-list");

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
  } catch (error) {
    console.error(error);
    totalOrdersEl.textContent = "--";
    totalRevenueEl.textContent = "--";
    busiestEl.textContent = "--";
    slowestEl.textContent = "--";
    renderList(topListEl, [], "Failed to load.");
    renderList(leastListEl, [], "Failed to load.");
  }
}

trendsDateInput.value = todayString();
trendsLoadBtn.addEventListener("click", loadTrends);
loadTrends();