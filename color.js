// Status label -> hex color mappings
const STATUS_COLORS = {
  Unrentable: "#484545",
  Lien0: "#232222",
  Problem: "#ff3f3f",
  Overlocked2: "#ff3f3f",
  Overlocked1: "#ff3f3f",
  Delinquent5: "#ffff10",
  Delinquent4: "#ffff10",
  Delinquent3: "#ffff10",
  Delinquent2: "#ffff10",
  Delinquent1: "#ffff10",
  Vacant: "#ffffff",
  Rented: "#ccffcc",
  Maintenance: "#ffe6cc",
  Complimentary: "#1c6abe",
  default: "#ffffff",
};

function getColorFromCode(code) {
  const normalized = String(code ?? "")
    .trim()
    .toLowerCase();
  const statusName =
    typeof getStatusNameFromCode === "function"
      ? getStatusNameFromCode(normalized)
      : codeToStatus[normalized];

  return STATUS_COLORS[statusName] || STATUS_COLORS.default;
}

const codeToColor = Object.entries(codeToStatus).reduce(
  (acc, [code, status]) => {
    const normalizedCode = String(code).trim().toLowerCase();
    acc[normalizedCode] = STATUS_COLORS[status] || STATUS_COLORS.default;
    return acc;
  },
  {},
);

console.log("Loaded color.js");
