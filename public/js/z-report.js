const zOrderCount = document.getElementById("z-order-count");
const zTotalSales = document.getElementById("z-total-sales");
const zAvgOrder = document.getElementById("z-avg-order");
const zStatus = document.getElementById("z-status");
const zPaymentBody = document.getElementById("z-payment-body");
const zGenerateBtn = document.getElementById("z-generate-btn");
const zMessage = document.getElementById("z-message");

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function renderZReport(report) {
  zOrderCount.textContent = Number(report.orderCount || 0);
  zTotalSales.textContent = money(report.totalSales);
  zAvgOrder.textContent = money(report.avgOrder);

  if (!report.paymentTotals || report.paymentTotals.length === 0) {
    zPaymentBody.innerHTML = `<tr><td colspan="2" class="empty-cell">No payment data for today.</td></tr>`;
    return;
  }

  zPaymentBody.innerHTML = report.paymentTotals
    .map(
      (row) => `
        <tr>
          <td>${row.method}</td>
          <td>${money(row.total)}</td>
        </tr>
      `
    )
    .join("");
}

function setBanner(message = "", type = "") {
  zMessage.textContent = message;
  zMessage.className = "banner";
  if (type) {
    zMessage.classList.add(type);
  }
}

async function loadZReport() {
  try {
    const response = await fetch("/api/reports/z/today");
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to load Z report.");
    }

    renderZReport(data.report);
    zStatus.textContent = data.alreadyGenerated ? "Already generated" : "Not generated";
    zGenerateBtn.disabled = data.alreadyGenerated;
    setBanner(
      data.alreadyGenerated
        ? "Today's Z report has already been generated."
        : "You can generate today's Z report once.",
      data.alreadyGenerated ? "warn" : "info"
    );
  } catch (error) {
    console.error(error);
    setBanner("Failed to load Z report.", "error");
  }
}

async function generateZReport() {
  const generatedBy = prompt("Enter manager name:", "Manager");
  if (generatedBy === null) return;

  try {
    zGenerateBtn.disabled = true;

    const response = await fetch("/api/reports/z/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ generatedBy })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to generate Z report.");
    }

    renderZReport(data.report);
    zStatus.textContent = "Already generated";
    setBanner("Z report generated successfully.", "success");
  } catch (error) {
    console.error(error);
    setBanner(error.message, "error");
    zGenerateBtn.disabled = false;
  }
}

zGenerateBtn.addEventListener("click", generateZReport);
loadZReport();