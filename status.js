// Lowercase status codes that have corresponding CSS rules
const colorCodedStatuses = [
  "l2",
  "l1",
  "l0",
  "r0",
  "o2",
  "o1",
  "d2",
  "d1",
  "e0",
  "u0",
  "c0",
];

const codeToStatus = {
  o2: "Overlocked2",
  o1: "Overlocked1",
  l2: "Lien0",
  l1: "Lien0",
  l0: "Lien0",
  d5: "Delinquent5",
  d4: "Delinquent4",
  d3: "Delinquent3",
  d2: "Delinquent2",
  d1: "Delinquent1",
  r0: "Rented",
  e0: "Vacant",
  u0: "Unrentable",
  c0: "Complimentary",
};

function normalizeStatusCode(code) {
  return String(code ?? "")
    .trim()
    .toLowerCase();
}

function getStatusNameFromCode(code) {
  const normalized = normalizeStatusCode(code);
  return codeToStatus[normalized] || null;
}

console.log("Loaded status.js");
