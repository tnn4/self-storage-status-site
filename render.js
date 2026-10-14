// COLORED TABLE LOGIC

// --- RENDERING --- //

function renderTable() {
  const headersTr = document.getElementById("tableHeaders");
  const bodyTr = document.getElementById("tableBody");
  headersTr.innerHTML = "";
  bodyTr.innerHTML = "";

  if (allResults.length === 0) {
    bodyTr.innerHTML =
      '<tr><td colspan="5" style="text-align:center;">No rows returned</td></tr>';
    document.getElementById("pageInfo").textContent = "Page 1 of 1";
    document.getElementById("prevBtn").disabled = true;
    document.getElementById("nextBtn").disabled = true;
    return;
  }

  // Setup Headers based on keys of the first returned object
  const keys = Object.keys(allResults[0]);
  keys.forEach((key) => {
    const th = document.createElement("th");
    th.textContent = key;
    headersTr.appendChild(th);
  });

  // Pagination slicing
  const totalPages = Math.ceil(allResults.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = allResults.slice(start, end);

  // Populate Rows
  paginatedData.forEach((row) => {
    const tr = document.createElement("tr");
    keys.forEach((key) => {
      const td = document.createElement("td");
      td.textContent = row[key] !== null ? row[key] : "";
      tr.appendChild(td);
    });
    bodyTr.appendChild(tr);
  });

  // Update Pagination controls
  document.getElementById("pageInfo").textContent =
    `Page ${currentPage} of ${totalPages} (Total: ${allResults.length} rows)`;
  document.getElementById("prevBtn").disabled = currentPage === 1;
  document.getElementById("nextBtn").disabled = currentPage >= totalPages;
}

function changePage(direction) {
  currentPage += direction;
  renderTable();
}

// NEW: Dynamic HTML Grid Renderer with Status Color-Coding
function renderTableColored(results) {
  const tableBody = document.getElementById("unitsTableBody");
  if (!tableBody) {
    console.error("UI Target element '#unitsTableBody' not found in DOM.");
    return;
  }

  tableBody.innerHTML = ""; // Clear prior entries
  const colorCodedStatuses = ["R0", "O1", "O2", "D1", "E0", "U0","C0","L0"];

  results.forEach((row) => {
    // Clean trailing spaces from statuses (e.g. 'E0 ' -> 'E0')
    const currentStatus = row.status ? row.status.trim() : "";

    // Match CSS rules
    const className = colorCodedStatuses.includes(currentStatus)
      ? `status-row-${currentStatus}`
      : "status-row-default";

    // Format Date output cleanly
    const paymentDate = row.paidtodate ? row.paidtodate.split("T")[0] : "N/A";

    // Construct HTML Row element
    const trHtml = `
            <tr class="${className}">
                <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>${row.unitno || ""}</strong></td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${currentStatus}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">$${Number(row.unitrate).toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${paymentDate}</td>
            </tr>
        `;
    tableBody.insertAdjacentHTML("beforeend", trHtml);
  });
}


// Dynamic HTML Grid Renderer with Status Color-Coding
function renderTableColored2(results) {
  const tableBody = document.getElementById("unitsTableBody");

  if (!tableBody) {
    console.error("UI Target element '#unitsTableBody' not found in DOM.");
    return;
  }

  tableBody.innerHTML = "";

  // Status codes that have corresponding CSS color rules
  const colorCodedStatuses = [
    "R0", // Rented
    "O1",
    "O2",
    "D1",
    "E0",
    "U0",
    "C0", // Complimentary
    "L0"  // Locked
  ];

  results.forEach((row) => {
    const currentStatus = String(row.status ?? "").trim();

    const className = colorCodedStatuses.includes(currentStatus)
      ? `status-row-${currentStatus}`
      : "status-row-default";

    const paymentDate = row.paidtodate
      ? String(row.paidtodate).split("T")[0]
      : "N/A";

    const rate = Number(row.unitrate);
    const formattedRate = Number.isFinite(rate)
      ? `$${rate.toFixed(2)}`
      : "N/A";

    const trHtml = `
      <tr class="${className}">
        <td style="padding: 8px; border: 1px solid #dee2e6;">
          <strong>${row.unitno ?? ""}</strong>
        </td>
        <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
          ${currentStatus}
        </td>
        <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">
          ${formattedRate}
        </td>
        <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
          ${paymentDate}
        </td>
      </tr>
    `;

    tableBody.insertAdjacentHTML("beforeend", trHtml);
  });
}

function renderColoredRows(data) {
  const tableBody = document.getElementById("table-body"); // Replace with your actual table body ID
  tableBody.innerHTML = ""; // Clear existing rows

  data.forEach((row) => {
    // Get color from map, fallback to default if status doesn't match
    const rowColor = STATUS_COLORS[row.status] || STATUS_COLORS["default"];

    const rowHtml = `
      <tr style="background-color: ${rowColor};">
        <td>${row.unitno}</td>
        <td>${row.status}</td>
        <td>$${row.rate}</td>
        <td>${row.paid_to_date || "N/A"}</td>
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", rowHtml);
  });
}
// END

// GRID CONTROL LOGIC

// Add new tracking state variables at the top of your script scope
let currentViewMode = "matrix"; // Options: 'list' or 'matrix'

// Programmatic CSS Matrix block variables mapping layout dimensions
const matrixStyle = document.createElement("style");
matrixStyle.innerHTML = `
    .unit-matrix-square {
        aspect-ratio: 1 / 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 2px solid #6c757d;
        border-radius: 4px;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        transition: transform 0.15s ease-in-out;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .unit-matrix-square:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .unit-matrix-square .sub-text {
        font-size: 10px;
        font-weight: normal;
        margin-top: 2px;
        opacity: 0.8;
    }
`;
document.head.appendChild(matrixStyle);

// -- RENDER COLORED MATRIX --



// Optimized implementation for your script injection layer
function renderMatrixView2(results) {
  const matrixContainer = document.getElementById("unitsGridMatrix");
  if (!matrixContainer) return;
  
  matrixContainer.innerHTML = ""; // Clear wrapper container

  results.forEach((row) => {
    const rawCode = row.status ? row.status.trim() : "";
    
    // 1. Get descriptive string mapping (e.g., "R0" -> "Rented")
    const statusText = codeToStatus[rawCode] || "default"; 
    
    // 2. Form class syntax matching our CSS targets
    const className = `status-row-${statusText}`;

    // Strip leading zeros safely for clean labels inside squares
    const displayLabel = row.unitno ? row.unitno.replace(/^0+/, "") : "??";

    const squareHtml = `
        <div class="unit-matrix-square ${className}" title="Unit: ${row.unitno}\nStatus: ${statusText} (${rawCode})\nRate: $${Number(row.unitrate).toFixed(2)}">
            <div>${displayLabel}</div>
            <div class="sub-text">${rawCode}</div>
        </div>
    `;
    matrixContainer.insertAdjacentHTML("beforeend", squareHtml);
  });
}

function renderUI(results) {
  const listContainer = document.getElementById("listLayoutContainer");
  const matrixContainer = document.getElementById("unitsGridMatrix");

  // Toggle primary parent display panels
  if (currentViewMode === "matrix") {
    listContainer.style.display = "none";
    matrixContainer.style.display = "grid";
    renderMatrixView2(results);
  } else {
    listContainer.style.display = "block";
    matrixContainer.style.display = "none";
    renderTableGrid(results); // Uses your prior existing function logic
  }
}


// -- INITIALIZE BUTTONS -- //

document.getElementById("btnRunQuery").addEventListener("click", async () => {
  const errorDiv = document.getElementById("errorMsg");
  errorDiv.textContent = "";

  try {
    // 1. Explicitly grab the text inside the click event
    const inputQuery = document.getElementById("sqlQuery").value;
    // rawResult = lowercaseKeys(inputQuery);
    // 2. Pass it into your pure function
    allResults = await executeQuery(inputQuery);
    currentPage = 1;

    // 3. Render the output
    updateUI();
  } catch (err) {
    errorDiv.textContent = "SQL Error: " + err.message;
  }
});

// Attach View Switching Button Event Listeners on Load initialization
document.getElementById("btnListView").addEventListener("click", () => {
  currentViewMode = "list";
  // No need to query the database again; just re-render the existing data
  updateUI();
});

document.getElementById("btnMatrixView").addEventListener("click", () => {
  currentViewMode = "matrix";
  // No need to query the database again; just re-render the existing data
  updateUI();
});

async function updateUI() {
  renderTable();
  renderTableColored(allResults);
  renderMatrixView2(allResults);
}

// PARTITION BY BUILDING
function renderMatrixView2(results) {
  const matrixContainer = document.getElementById("unitsGridMatrix");
  if (!matrixContainer) return;

  matrixContainer.innerHTML = ""; // Clear container

  const colorCodedStatuses = ["R0", "O1", "O2", "D1", "E0", "U0", "C0", "L0"];

  // 1. Group records by their alphabetical prefix
  const sections = {};

  results.forEach((row) => {
    const unitStr = row.unitno ? String(row.unitno).trim() : "";

    // Extract letters from the start/content (e.g., "A001" -> "A", "105" -> "Numbers")
    const match = unitStr.match(/^[A-Za-z]+/);
    const prefix = match ? match[0].toUpperCase() : "Numbers";

    if (!sections[prefix]) {
      sections[prefix] = [];
    }
    sections[prefix].push(row);
  });

  // 2. Iterate through sorted alpha keys and build UI blocks
  const sortedPrefixes = Object.keys(sections).sort((a, b) => {
    if (a === "Numbers") return -1; // Push pure numbers to top, or change to 1 to push to bottom
    if (b === "Numbers") return 1;
    return a.localeCompare(b);
  });

  sortedPrefixes.forEach((prefix) => {
    // Create a unique section block to house headers and its nested squares
    const sectionWrapper = document.createElement("div");
    sectionWrapper.style.cssText = `
            grid-column: 1 / -1; 
            margin-top: 20px; 
            margin-bottom: 10px;
        `;

    // Dynamic Label Header
    sectionWrapper.innerHTML = `
            <h3 style="margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #dee2e6; color: #495057;">
                Section ${prefix}
            </h3>
        `;
    matrixContainer.appendChild(sectionWrapper);

    // Sub-grid row container for this prefix cluster
    const gridRow = document.createElement("div");
    gridRow.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
            gap: 8px;
            margin-bottom: 20px;
        `;

    // Populate items belonging to this group context
    sections[prefix].forEach((row) => {
      const currentStatus = row.status ? row.status.trim() : "";
      const className = colorCodedStatuses.includes(currentStatus)
        ? `status-row-${currentStatus}`
        : "status-row-default";

      // Clean display labels by stripping excess leading padding zeros (e.g. "A0004" -> "A4")
      // Retains letter prefix context during layout print string building
      const displayLabel = row.unitno
        ? row.unitno.replace(/^([A-Za-z]*)0+/, "\$1")
        : "??";

      const squareHtml = `
                <div class="unit-matrix-square ${className}" title="Unit: ${row.unitno}\nStatus: ${currentStatus}\nRate: $${row.unitrate}">
                    <div>${displayLabel}</div>
                    <div class="sub-text">${currentStatus}</div>
                </div>
            `;
      gridRow.insertAdjacentHTML("beforeend", squareHtml);
    });

    matrixContainer.appendChild(gridRow);
  });
}

// END
console.log('Loaded render.js');