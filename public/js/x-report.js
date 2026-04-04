const xDateInput = document.getElementById("x-date");
const xLoadBtn = document.getElementById("x-load-btn");
const xBody = document.getElementById("x-report-body");
const xDateBadge = document.getElementById("x-report-date");
const xTotalSales = document.getElementById("x-total-sales");
const xTotalVoids = document.getElementById("x-total-voids");
const xTotalReturns = document.getElementById("x-total-returns");
const xTotalDiscards = document.getElementById("x-total-discards");

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function hourLabel(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

async function loadXReport() {
  const date = xDateInput.value || todayString();

  xBody.innerHTML = `<tr><td colspan="5" class="empty-cell">Loading...</td></tr>`;

  try {
    const response = await fetch(`/api/reports/x?date=${encodeURIComponent(date)}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to load X report.");
    }

    xDateBadge.textContent = data.date;
    xTotalSales.textContent = money(data.totals.sales);
    xTotalVoids.textContent = Number(data.totals.voids);
    xTotalReturns.textContent = money(data.totals.returns);
    xTotalDiscards.textContent = Number(data.totals.discards);

    if (!data.rows || data.rows.length === 0) {
      xBody.innerHTML = `<tr><td colspan="5" class="empty-cell">No data found.</td></tr>`;
      return;
    }

    xBody.innerHTML = data.rows
      .map(
        (row) => `
          <tr>
            <td>${hourLabel(row.hour)}</td>
            <td>${money(row.sales)}</td>
            <td>${Number(row.voids)}</td>
            <td>${money(row.returns)}</td>
            <td>${Number(row.discards)}</td>
          </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error(error);
    xBody.innerHTML = `<tr><td colspan="5" class="empty-cell">Failed to load report.</td></tr>`;
  }
}

xDateInput.value = todayString();
xLoadBtn.addEventListener("click", loadXReport);
loadXReport();