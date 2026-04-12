document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateBtn");
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const tableBody = document.querySelector("#productUsageTable tbody");
  const banner = document.getElementById("messageBanner");
  const resultCount = document.getElementById("resultCount");

  function showBanner(type, text) {
    banner.className = "banner";

    if (text) {
      banner.classList.add(type);
      banner.textContent = text;
    } else {
      banner.textContent = "";
    }
  }

  function setEmptyRow(text) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-cell">${text}</td>
      </tr>
    `;
  }

  async function loadProductUsage() {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    showBanner("", "");
    resultCount.textContent = "0 items";

    if (!startDate || !endDate) {
      showBanner("warn", "Please enter both start and end dates.");
      setEmptyRow("Please enter a valid start and end date.");
      return;
    }

    if (startDate > endDate) {
      showBanner("warn", "Start date cannot be after end date.");
      setEmptyRow("Please choose a valid date range.");
      return;
    }

    setEmptyRow("Loading report...");

    try {
      const response = await fetch(
        `/reports/api/product-usage?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );

      const data = await response.json();

      if (!response.ok) {
        showBanner("error", data.error || "Failed to retrieve product usage data.");
        setEmptyRow("Unable to load report data.");
        return;
      }

      if (!Array.isArray(data) || data.length === 0) {
        showBanner("info", "No product usage data was found for that date range.");
        setEmptyRow("No data was retrieved.");
        return;
      }

      tableBody.innerHTML = "";
      resultCount.textContent = `${data.length} item${data.length === 1 ? "" : "s"}`;

      data.forEach((item) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${item.inventory_item_id}</td>
          <td>${item.name}</td>
          <td class="numeric">${Number(item.total_used).toFixed(2)}</td>
          <td>${item.measurement_units}</td>
        `;

        tableBody.appendChild(row);
      });

      showBanner("success", "Product usage report generated successfully.");
    } catch (error) {
      console.error("Error fetching product usage data:", error);
      showBanner("error", "An error occurred while retrieving product usage data.");
      setEmptyRow("An unexpected error occurred.");
    }
  }

  generateBtn.addEventListener("click", loadProductUsage);
});