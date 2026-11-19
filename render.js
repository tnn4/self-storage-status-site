let renderDebugMode = false;
let currentViewMode = "matrix"; // 'list' or 'matrix'

function changePage(direction) {
  currentPage += direction;
  renderTable();
}

/**
 * Normalizes a row's status to lowercase for CSS classes while keeping
 * an uppercase label for display and resolving its hex color via color.js.
 */
function getStatusInfo(row) {
  const rawStatus = row?.status ?? row?.Status ?? "";
  const code =
    typeof normalizeStatusCode === "function"
      ? normalizeStatusCode(rawStatus)
      : String(rawStatus).trim().toLowerCase();

  const allowedStatuses =
    typeof colorCodedStatuses !== "undefined" &&
    Array.isArray(colorCodedStatuses)
      ? colorCodedStatuses.map((s) => String(s).trim().toLowerCase())
      : [];

  const isKnownStatus = code.length > 0 && allowedStatuses.includes(code);
  const bgColor =
    typeof getColorFromCode === "function" ? getColorFromCode(code) : "#ffffff";

  return {
    code,
    displayCode: code ? code.toUpperCase() : "",
    className: isKnownStatus ? `status-row-${code}` : "status-row-default",
    bgColor,
  };
}

function formatCurrency(value) {
  const num = Number(value);
  return Number.isFinite(num) ? `$${num.toFixed(2)}` : "$0.00";
}

function formatDate(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === "") {
    return "N/A";
  }

  const str = String(raw).trim();
  const numericVal =
    typeof raw === "number" ? raw : /^\d{10,}$/.test(str) ? Number(str) : NaN;

  if (Number.isFinite(numericVal)) {
    const d = new Date(numericVal);
    if (!Number.isNaN(d.getTime())) {
      const pad = (x) => String(x).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
  }

  return str.includes("T") ? str.split("T")[0] : str;
}

// --- RAW PAGINATED TABLE ---

function renderTable() {
  const headersTr = document.getElementById("tableHeaders");
  const bodyTr = document.getElementById("tableBody");
  if (!headersTr || !bodyTr) return;

  headersTr.innerHTML = "";
  bodyTr.innerHTML = "";

  if (!Array.isArray(allResults) || allResults.length === 0) {
    bodyTr.innerHTML =
      '<tr><td colspan="5" style="text-align:center;">No rows returned</td></tr>';
    document.getElementById("pageInfo").textContent = "Page 1 of 1";
    document.getElementById("prevBtn").disabled = true;
    document.getElementById("nextBtn").disabled = true;
    return;
  }

  const keys = Object.keys(allResults[0]);
  keys.forEach((key) => {
    const th = document.createElement("th");
    th.textContent = key;
    headersTr.appendChild(th);
  });

  const totalPages = Math.ceil(allResults.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const paginatedData = allResults.slice(start, start + rowsPerPage);

  paginatedData.forEach((row) => {
    const tr = document.createElement("tr");
    keys.forEach((key) => {
      const td = document.createElement("td");
      td.textContent =
        row[key] !== null && row[key] !== undefined ? row[key] : "";
      tr.appendChild(td);
    });
    bodyTr.appendChild(tr);
  });

  document.getElementById("pageInfo").textContent =
    `Page ${currentPage} of ${totalPages} (Total: ${allResults.length} rows)`;
  document.getElementById("prevBtn").disabled = currentPage === 1;
  document.getElementById("nextBtn").disabled = currentPage >= totalPages;
}

// --- COLORED LIST TABLE ---

function renderColoredTable(results) {
  const tableBody = document.getElementById("activeUnitsTableBody");
  if (!tableBody) {
    console.error(
      "UI Target element '#activeUnitsTableBody' not found in DOM.",
    );
    return;
  }

  tableBody.innerHTML = "";
  if (!Array.isArray(results) || results.length === 0) return;

  if (renderDebugMode) {
    console.log(JSON.stringify(results, null, 2));
  }

  results.forEach((row) => {
    const unitNo = row.unitno ?? row.UnitNo ?? "";
    const rawRate = row.unitrate ?? row.UnitRate ?? 0;
    const rawDate = row.paidtodate ?? row.PaidtoDate ?? row.paid_to_date ?? "";
    const balance = row.balance ?? 0;

    const { displayCode, className, bgColor } = getStatusInfo(row);
    const formattedRate = formatCurrency(rawRate);
    const formattedBalance = formatCurrency(balance);
    const paymentDate = formatDate(rawDate);

    if (renderDebugMode) {
      console.log(
        `unit=${unitNo}, status=${displayCode}, paidToDate=${paymentDate}, color=${bgColor}`,
      );
    }

    const trHtml = `
      <tr class="${className}" style="background-color: ${bgColor};">
        <td><strong>${unitNo}</strong></td>
        <td style="text-align: center;">${displayCode}</td>
        <td style="text-align: right;">${formattedRate}</td>
        <td style="text-align: center;">${formattedBalance}</td>
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", trHtml);
  });
}

// --- COLORED MATRIX GRID ---

function renderUI(results) {
  const listContainer = document.getElementById("listLayoutContainer");
  const matrixContainer = document.getElementById("unitsGridMatrix");

  if (currentViewMode === "matrix") {
    if (listContainer) listContainer.style.display = "none";
    if (matrixContainer) matrixContainer.style.display = "grid";
    renderMatrixView2(results);
  } else {
    if (listContainer) listContainer.style.display = "block";
    if (matrixContainer) matrixContainer.style.display = "none";
    renderColoredTable(results);
  }
}

// #region matrix_view

// #region popup
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getOrCreateUnitPopover() {
  let popover = document.getElementById("unitDetailPopover");
  if (popover) return popover;

  popover = document.createElement("div");
  popover.id = "unitDetailPopover";
  popover.className = "unit-popover";
  popover.hidden = true;
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-live", "polite");

  document.body.appendChild(popover);
  return popover;
}

function hideUnitPopover() {
  const popover = document.getElementById("unitDetailPopover");
  if (popover) {
    popover.hidden = true;
  }
}

function showUnitPopoverFromSquare(squareEl) {
  const popover = getOrCreateUnitPopover();

  const unit = squareEl.dataset.unit || "??";
  const status = squareEl.dataset.status || "";
  const balance = squareEl.dataset.balance || "$0.00";
  const rate = squareEl.dataset.rate || "$0.00";
  const paidToDate = squareEl.dataset.paidToDate || "N/A";

  popover.innerHTML = `
    <div class="unit-popover__header">
      <span>Unit ${escapeHtml(unit)}</span>
      <button type="button" class="unit-popover__close" aria-label="Close">✕</button>
    </div>
    <div class="unit-popover__balance">Balance: ${escapeHtml(balance)}</div>
    <div class="unit-popover__meta">
      Status: <strong>${escapeHtml(status)}</strong> · Rate: ${escapeHtml(rate)} · Paid To: ${escapeHtml(paidToDate)}
    </div>
  `;

  popover.hidden = false;

  popover
    .querySelector(".unit-popover__close")
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      hideUnitPopover();
    });
}
// #endregion

function renderMatrixView2(results) {
  const matrixContainer = document.getElementById("unitsGridMatrix");
  if (!matrixContainer) return;

  matrixContainer.innerHTML = "";
  if (!Array.isArray(results) || results.length === 0) return;

  const sections = {};

  results.forEach((row) => {
    const unitStr = row.unitno ? String(row.unitno).trim() : "";
    const match = unitStr.match(/^[A-Za-z]+/);
    const prefix = match ? match[0].toUpperCase() : "Numbers";

    if (!sections[prefix]) {
      sections[prefix] = [];
    }
    sections[prefix].push(row);
  });

  const sortedPrefixes = Object.keys(sections).sort((a, b) => {
    if (a === "Numbers") return -1;
    if (b === "Numbers") return 1;
    return a.localeCompare(b);
  });

  sortedPrefixes.forEach((prefix) => {
    const sectionWrapper = document.createElement("div");
    sectionWrapper.style.cssText = `
      grid-column: 1 / -1;
      margin-top: 20px;
      margin-bottom: 10px;
    `;
    sectionWrapper.innerHTML = `
      <h3 style="margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #dee2e6; color: #495057;">
        Section ${prefix}
      </h3>
    `;
    matrixContainer.appendChild(sectionWrapper);

    const gridRow = document.createElement("div");
    gridRow.style.cssText = `
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
      gap: 8px;
      margin-bottom: 20px;
    `;

    sections[prefix].forEach((row) => {
      const { displayCode, className, bgColor } = getStatusInfo(row);
      const displayLabel = row.unitno
        ? String(row.unitno).replace(/^([A-Za-z]*)0+/, "$1")
        : "??";
      const formattedBalance = formatCurrency(row.balance);

      const squareHtml = `
        <div
          class="unit-matrix-square ${className}"
          style="background-color: ${bgColor};"
          title="Unit: ${row.unitno}\nStatus: ${displayCode}\nBalance: ${formattedBalance}"
        >
          <div>${displayLabel}</div>
          <div class="sub-text">${displayCode}</div>
        </div>
      `;
      gridRow.insertAdjacentHTML("beforeend", squareHtml);
    });

    matrixContainer.appendChild(gridRow);
  });

  // #region popover stuff
  document.addEventListener("click", (event) => {
    const square = event.target.closest("#unitsGridMatrix .unit-matrix-square");
    if (square) {
      event.stopPropagation();
      showUnitPopoverFromSquare(square);
      return;
    }

    const popover = document.getElementById("unitDetailPopover");
    if (
      popover &&
      !popover.hidden &&
      !event.target.closest("#unitDetailPopover")
    ) {
      hideUnitPopover();
    }
  });
  // #endregion
}
// #endregion

async function updateUI() {
  renderTable();
  renderColoredTable(allResults);
  renderMatrixView2(allResults);
}

const debugBtn = document.getElementById("toggleRenderDebugButton");
if (debugBtn) {
  debugBtn.addEventListener("click", () => {
    renderDebugMode = !renderDebugMode;
    console.log(`Render debug mode = ${renderDebugMode}`);
  });
}

console.log("Loaded render.js");
