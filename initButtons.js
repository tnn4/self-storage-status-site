// -- INITIALIZE BUTTONS -- //

async function handleQueryButtonClick() {
  const errorDiv = document.getElementById("errorMsg");
  errorDiv.textContent = "";

  try {
    const inputQuery = document.getElementById("sqlQuery").value;

    allResults = await executeQuery(inputQuery);

    currentPage = 1;
    updateUI();
  } catch (err) {
    console.error("Query failed:", err);
    errorDiv.textContent = "PostgreSQL Error: " + err.message;
  }
}

function main() {
  document.getElementById("btnRunQuery").addEventListener("click", async () => {
    await handleQueryButtonClick();
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
}

main();
console.log("Loaded initButtons.js");
