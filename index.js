// --- 1. CONFIGURATION ---
const SUPABASE_URL = "https://ryehsunhoycigiviuupl.supabase.co/";
const SUPABASE_ANON_KEY = "sb_publishable_KSECkuaRIqINH3OmBxJHlg_U_gs0y0L";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


let allResults = [];
let currentPage = 1;
const rowsPerPage = 500;


// -- QUERIES -- //
const currentUnitQuery = String.raw`
SELECT DISTINCT * 
FROM units 
WHERE (modate IS NULL) OR (modate LIKE '1899-12-30%') 
ORDER BY 
    removeNumbers(unitno) ASC,        
    extractNumbers(unitno) ASC;`;

const universalCurrentUnitQuery = String.raw`
SELECT unitno, status, unitrate, paidtodate
FROM units 
WHERE ((modate IS NULL) OR (modate LIKE '1899-12-30%'))
  AND unitno IS NOT NULL
  AND unitno != ''
  AND custid IS NOT NULL
GROUP BY unitno, status, unitrate, paidtodate
ORDER BY 
    CASE 
        WHEN unitno LIKE '0A%' THEN '0A'
        WHEN unitno LIKE '0D%' THEN '0D'
        WHEN unitno LIKE '0F%' THEN '0F'
        WHEN unitno LIKE '0G%' THEN '0G'
        WHEN unitno LIKE '0H%' THEN '0H'
        WHEN unitno LIKE '0I%' THEN '0I'
        WHEN unitno LIKE '0J%' THEN '0J'
        ELSE '' 
    END ASC,
    LENGTH(unitno) ASC, 
    unitno ASC;
`;

const universalCurrentUnitQuery2 = String.raw`
SELECT unitno, status, unitrate, paidtodate
FROM (
    SELECT 
        -- Standardize columns for clean output
        LOWER(TRIM(unitno)) AS unitno, 
        LOWER(TRIM(status)) AS status, 
        unitrate, 
        paidtodate,
        -- Force partition grouping on stripped lowercase text values to prevent hidden doubling
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(TRIM(unitno)) 
            ORDER BY 
                CASE 
                    WHEN LOWER(TRIM(status)) = 'd1' THEN 1 
                    WHEN LOWER(TRIM(status)) = 'o2' THEN 2 
                    WHEN LOWER(TRIM(status)) = 'o1' THEN 3 
                    WHEN LOWER(TRIM(status)) = 'l0' THEN 4 
                    WHEN LOWER(TRIM(status)) = 'r0' THEN 5 
                    WHEN LOWER(TRIM(status)) = 'c0' THEN 6 
                    WHEN LOWER(TRIM(status)) = 'e0' THEN 7 
                    ELSE 8                    
                END ASC,
                paidtodate DESC
        ) AS rn
    FROM units
    WHERE ((modate IS NULL) OR (modate LIKE '1899-12-30%'))
      AND unitno IS NOT NULL
) 
WHERE rn = 1  
ORDER BY 
    CASE 
        WHEN unitno LIKE '0a%' THEN '0A'
        WHEN unitno LIKE '0d%' THEN '0D'
        WHEN unitno LIKE '0f%' THEN '0F'
        WHEN unitno LIKE '0g%' THEN '0G'
        WHEN unitno LIKE '0h%' THEN '0H'
        WHEN unitno LIKE '0i%' THEN '0I'
        WHEN unitno LIKE '0j%' THEN '0J'
        ELSE '' 
    END ASC,
    LENGTH(unitno) ASC, 
    unitno ASC;
`;
//

// lowercase helper Function
function lowercaseKeys(inputData) {
  // 1. If AlaSQL returns null or undefined, safely bail out with an empty array
  if (!inputData) return [];

  // 2. Force the data into a standard flat array, handling internal AlaSQL object structures
  let array = [];
  if (Array.isArray(inputData)) {
    array = inputData;
  } else if (typeof inputData === 'object') {
    // If AlaSQL wrapped the results inside a dictionary or data payload, extract the keys
    array = inputData.data || Object.values(inputData);
  } else {
    return [];
  }

  // 3. Perform the lowercase normalization mapping safely
  return array.map(obj => {
    if (!obj || typeof obj !== 'object') return obj;
    return Object.keys(obj).reduce((acc, key) => {
      acc[key.toLowerCase()] = typeof obj[key] === 'string' ? obj[key].trim() : obj[key];
      return acc;
    }, {});
  });
}



// --- 2. FETCH & CACHE DATA ---
async function getCachedUnits() {
  const batchSize = 500;
  const allData = [];

  for (let from = 0; ; from += batchSize) {
    const to = from + batchSize - 1;

    const { data, error } = await supabaseClient
      .from("unit")
      .select("*")
      .range(from, to);

    if (error) {
      throw new Error(`Supabase fetch failed at row ${from}: ${error.message}`);
    }

    allData.push(...data);

    if (data.length < batchSize) {
      break;
    }
  }

  console.log("Total Supabase rows fetched:", allData.length);
  console.log("First row:", allData[0]);

  return allData;
}

// --- 3. EXECUTE SQL  ---


/**
 * Executes an AlaSQL query against cached units data.
 * Pure data function: No DOM updates, no rendering side effects.
 *
 * @param {string} rawQueryText - The SQL query string from the user input.
 * @returns {Promise<Array>} The resulting rows from the database query.
 */
async function executeQuery(rawQueryText = "") {
  if (!rawQueryText.trim()) {
    console.warn("executeQuery was called with an empty string");
    return [];
  }
  // 1. Fetch data dependencies
  const data = await getCachedUnits();
  console.log("Rows available to SQL:", data.length);

  // 2. Setup the AlaSQL in-memory table
  alasql("DROP TABLE IF EXISTS units");
  alasql("CREATE TABLE units");
  alasql.tables.units.data = data;

  // 3. Normalize the query format
  const queryText = rawQueryText.replace(/\bFROM\s+\?/i, "FROM units");

  // 4. Run query and return the data result directly
  const results = alasql(queryText);
  console.log("SQL result count:", results.length);

  return results;
}

// This handler manages the UI side effects and calls the pure function
async function handleQueryButtonClick() {
  const errorDiv = document.getElementById("errorMsg");
  errorDiv.textContent = "";

  try {
    const inputQuery = document.getElementById("sqlQuery").value;

    // Call the cleaner data function
    allResults = await executeQuery(inputQuery);
    currentPage = 1;

    // allResults = lowercaseKeys(rawResults);
    // Render logic lives purely in the UI orchestration layer
    console.log('Applied lowercase')
    renderTable();
    renderTableColored(allResults);
    renderMatrixView2(allResults);
  } catch (err) {
    console.error("Query failed:", err);
    errorDiv.textContent = "SQL Error: " + err.message;
  }
}



// --- SQL HELPER FUNCTIONS ---
// Function to remove numbers and order units

alasql.fn.removeNumbers = function (str) {
  return str ? str.replace(/[0-9]/g, "") : "";
};

// Function to keep only numbers
alasql.fn.extractNumbers = function (str) {
  var num = str ? str.replace(/[^0-9]/g, "") : "";
  return num ? parseInt(num, 10) : 0;
};

// Lowercase aliases just in case we write query differently
alasql.fn.removenumbers = function (str) {
  return str ? str.replace(/[0-9]/g, "") : "";
};

// Function to keep only numbers
alasql.fn.extractnumbers = function (str) {
  var num = str ? str.replace(/[^0-9]/g, "") : "";
  return num ? parseInt(num, 10) : 0;
};


// Date text -> sortable number (ms). Returns null for junk, 'N/A', and the 1899 sentinel.
alasql.fn.dateToNum = function (s) {
  if (s == null) return null;
  const t = Date.parse(String(s).trim());
  return Number.isFinite(t) && t > Date.parse("1990-01-01") ? t : null;
};

// Number -> YYYY-MM-DD (local time)
alasql.fn.numToDate = function (n) {
  if (n == null || !Number.isFinite(n)) return null;
  const d = new Date(n);
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// END


// --- NETWORK TESTS ---

async function testSupabaseConnection() {
  const errorDiv = document.getElementById("errorMsg");

  errorDiv.style.color = "#333";
  errorDiv.textContent = "Testing Supabase API connection...";

  try {
    if (typeof supabase === "undefined") {
      throw new Error("Supabase library failed to load from the CDN.");
    }

    const { data, error, status } = await supabaseClient
      .from("unit")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Supabase API error:", error);
      throw new Error(`HTTP ${status}: ${error.message}`);
    }

    errorDiv.style.color = "green";
    errorDiv.textContent = "API connection successful. HTTP " + status;

    console.log("Supabase API connection successful.");
  } catch (err) {
    errorDiv.style.color = "red";
    errorDiv.textContent = "Connection failed: " + err.message;
    console.error("Connection test failed:", err);
  }
}

async function diagnoseUnitTable() {
  const output = document.getElementById("errorMsg");

  try {
    const { data, error, count, status, statusText } = await supabaseClient
      .from("unit")
      .select("*", { count: "exact" })
      .limit(5);

    console.log("HTTP status:", status, statusText);
    console.log("API error:", error);
    console.log("Exact count:", count);
    console.log("Rows returned:", data?.length);
    console.log("Sample data:", data);

    if (error) {
      output.textContent = "API error: " + error.message;
      return;
    }

    output.textContent =
      `HTTP ${status}. Rows returned: ${data.length}. ` +
      `Exact count: ${count ?? "unavailable"}. ` +
      "See browser Console for details.";
  } catch (err) {
    output.textContent = "Request failed: " + err.message;
    console.error(err);
  }
}
// END

console.log('Loaded index.js')