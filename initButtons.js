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

console.log('Loaded initButtons.js');