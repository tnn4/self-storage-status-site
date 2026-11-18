  // Status codes that have corresponding CSS color rules
  const colorCodedStatuses = [
    "L2", "l2",
    "L1", "l1", // Lien done
    "L0", "l0", // Lien
    "R0", "r0", // Rented
    "O2", "o2", // overlocked
    "O1", "o1", 
    "D2", "d2", // delinquent
    "D1", "d1",
    "E0", "e0", // vacant
    "U0", "u0", // unrentable
    "C0", "c0", // Complimentary
    
  ];

const codeToStatus = {
  O2: "Overlocked2", o2: "Overlocked2",
  O1: "Overlocked1", o1: "Overlocked1",
  L2: "Lien0", l2: "Lien0",
  L1: "Lien0", l1: "Lien0",
  L0: "Lien0", l0: "Lien0",
  D5: "Delinquint5", d5: "Delinquint5",
  D4: "Delinquint4", d4: "Delinquint4",
  D3: "Delinquint3", d3: "Delinquint3",
  D2: "Delinquint2", d2: "Delinquint2",
  D1: "Delinquint1", d1: "Delinquint1",
  R0: "Rented", r0: "Rented",
  E0: "Vacant", e0: "Vacant",
  U0: "Unrentable", u0: "Unrentable",
  C0: "Complimentary", c0: "Complimentary"
};

// Define status-to-color mappings
const STATUS_COLORS = {
  Unrentable: "#c0c0c0",
  Lien0: "#000000",
  Problem: "#ff3f3f",
  Overlocked2: "#ff3f3f",
  Overlocked1: "#ff3f3f",
  Delinquent2: "#ffff10",
  Delinquent1: "#ffff10",
  Vacant: "#ffffff",
  Rented: "#ccffcc", // Soft Green
  Maintenance: "#ffe6cc", // Soft Orange
  Complimentary: "#e6f2ff", // Soft Blue
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