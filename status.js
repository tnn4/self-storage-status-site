
const codeToStatus = {
  R0: "Rented",
  O1: "Late",
  O2: "SuperLate",
  L0: "Locked",
  D1: "Delinquint",
  E0: "Vacant",
  U0: "Unrentable",
  C0: "Complimentary"
};

// Define status-to-color mappings
const STATUS_COLORS = {
  Locked: "#000000",
  Problem: "#ff3f3f",
  Delinquint: "#ff3f3f",
  SuperLate: "#ff3f3f",
  Late: "#ffff10",
  Vacant: "#ffffff", 
  Rented: "#ccffcc", // Soft Green
  Maintenance: "#ffe6cc", // Soft Orange
  Complimentary: "#e6f2ff", // Soft Blue
  Unrentable: "#c0c0c0",
  // Add fallback or other statuses as needed
  default: "#ffffff",
};

// 🟢 The Function to Combine Them
function getColorFromCode(code) {
  // 1. Get the status name from the code (e.g., "R0" -> "Rented")
  const status = codeToStatus[code];
  
  // 2. Get the color for that status, or fall back to the default color
  return STATUS_COLORS[status] || STATUS_COLORS.default;
}

// For max performance
const codeToColor = Object.entries(codeToStatus).reduce((acc, [code, status]) => {
  acc[code] = STATUS_COLORS[status] || STATUS_COLORS.default;
  return acc;
}, {});
//

console.log('Loaded status.js');