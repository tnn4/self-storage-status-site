// --- 1. CONFIGURATION & PGlite SETUP ---
// redundant but keep for now
const SUPABASE_URL2 = "https://ryehsunhoycigiviuupl.supabase.co/";
const SUPABASE_ANON_KEY2 = "sb_publishable_KSECkuaRIqINH3OmBxJHlg_U_gs0y0L";

const SUPABASE_URL = window.APP_CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.APP_CONFIG.SUPABASE_ANON_KEY;

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allResults = [];
let rowBatchInsertionSize = 100;
let currentPage = 1;
const rowsPerPage = 1000;

let pgDb = null;

async function initPGlite() {
  if (pgDb) return pgDb;

  pgDb = new PGlite("idb://units-db");

  await pgDb.waitReady;

  console.log("PGlite initialized successfully.");
  return pgDb;
}

// --- 2. FETCH & POPULATE DATA ---
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
    if (data.length < batchSize) break;
  }

  console.log("Total Supabase rows fetched:", allData.length);
  return allData;
}

async function syncSupabaseToPGlite() {
  let rows;
  const db = await initPGlite();
  const errorDiv = document.getElementById("errorMsg");

  const runBtn = document.getElementById("btnRunQuery");
  // Ensure button stays disabled and shows status
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.textContent = "Syncing rows...";
  }

  try {
    rows = await getCachedUnits();
    if (errorDiv)
      errorDiv.textContent = `Syncing ${rows} rows from Supabase...`;
    if (rows.length === 0) return;

    console.log("Creating table schema in PGlite using native types...");
    await db.exec(`
    DROP TABLE IF EXISTS unit;
    CREATE TABLE public.unit (
        moddate timestamp without time zone,
        custid double precision,
        site bigint,
        unitno text,
        count bigint,
        walknumber text,
        status text,
        size text,
        midate timestamp without time zone,
        modate timestamp without time zone,
        expvac timestamp without time zone,
        rentdueday bigint,
        paidtodate timestamp without time zone,
        preleasetill timestamp without time zone,
        lastpaid timestamp without time zone,
        unitrate double precision,
        lastrate double precision,
        secdep double precision,
        pldep double precision,
        lastratechange timestamp without time zone,
        ratechangeallowed boolean,
        nextrate double precision,
        ratechangedate timestamp without time zone,
        ratechargemethod bigint,
        timeslate bigint,
        passcode bigint,
        cardno bigint,
        timezone bigint,
        accesslevel bigint,
        ainumber bigint,
        psstatus bigint,
        "primary" bigint,
        retchecktimes bigint,
        retcheckdate timestamp without time zone,
        retcheckno text,
        retcheckamt double precision,
        retcheckfee double precision,
        monthcharge double precision,
        currentrent double precision,
        day30 double precision,
        day60 double precision,
        day90 double precision,
        latefee double precision,
        usetax double precision,
        salestax double precision,
        lien double precision,
        adminfee double precision,
        pastduedep double precision,
        inspastdue double precision,
        inspolicyno text,
        insprem double precision,
        inscoverage double precision,
        inspaidtodate timestamp without time zone,
        insstartdate timestamp without time zone,
        locked boolean,
        lockedtoday boolean,
        unlockedtoday boolean,
        rvlength double precision,
        comments text,
        extra1 text,
        extra2 text,
        extra3 text,
        monthacct01 bigint,
        month01 double precision,
        monthacct02 bigint,
        month02 double precision,
        monthacct03 bigint,
        month03 double precision,
        monthacct04 bigint,
        month04 double precision,
        monthacct05 bigint,
        month05 double precision,
        mcharacct01 bigint,
        mchar01 double precision,
        mcharacct02 bigint,
        mchar02 double precision,
        mcharacct03 bigint,
        mchar03 double precision,
        mcharacct04 bigint,
        mchar04 double precision,
        mcharacct05 bigint,
        mchar05 bigint,
        mcredacct01 bigint,
        mcred01 double precision,
        mcredacct02 bigint,
        mcred02 double precision,
        mcredacct03 bigint,
        mcred03 double precision,
        mcredacct04 bigint,
        mcred04 double precision,
        mcredacct05 bigint,
        mcred05 double precision,
        theftpercent bigint,
        elevacclevel bigint,
        latefeeid bigint,
        routingnumber text,
        accountnumber text,
        unittype bigint,
        lightingzoneid bigint,
        displayorder bigint
    );
  `);

    console.log("Inserting rows in optimized batches...");
    const keys = [
      "moddate",
      "custid",
      "site",
      "unitno",
      "count",
      "walknumber",
      "status",
      "size",
      "midate",
      "modate",
      "expvac",
      "rentdueday",
      "paidtodate",
      "preleasetill",
      "lastpaid",
      "unitrate",
      "lastrate",
      "secdep",
      "pldep",
      "lastratechange",
      "ratechangeallowed",
      "nextrate",
      "ratechangedate",
      "ratechargemethod",
      "timeslate",
      "passcode",
      "cardno",
      "timezone",
      "accesslevel",
      "ainumber",
      "psstatus",
      "primary",
      "retchecktimes",
      "retcheckdate",
      "retcheckno",
      "retcheckamt",
      "retcheckfee",
      "monthcharge",
      "currentrent",
      "day30",
      "day60",
      "day90",
      "latefee",
      "usetax",
      "salestax",
      "lien",
      "adminfee",
      "pastduedep",
      "inspastdue",
      "inspolicyno",
      "insprem",
      "inscoverage",
      "inspaidtodate",
      "insstartdate",
      "locked",
      "lockedtoday",
      "unlockedtoday",
      "rvlength",
      "comments",
      "extra1",
      "extra2",
      "extra3",
      "monthacct01",
      "month01",
      "monthacct02",
      "month02",
      "monthacct03",
      "month03",
      "monthacct04",
      "month04",
      "monthacct05",
      "month05",
      "mcharacct01",
      "mchar01",
      "mcharacct02",
      "mchar02",
      "mcharacct03",
      "mchar03",
      "mcharacct04",
      "mchar04",
      "mcharacct05",
      "mchar05",
      "mcredacct01",
      "mcred01",
      "mcredacct02",
      "mcred02",
      "mcredacct03",
      "mcred03",
      "mcredacct04",
      "mcred04",
      "mcredacct05",
      "mcred05",
      "theftpercent",
      "elevacclevel",
      "latefeeid",
      "routingnumber",
      "accountnumber",
      "unittype",
      "lightingzoneid",
      "displayorder",
    ];

    const dbCols = keys.map((k) => (k === "primary" ? '"primary"' : `"${k}"`));
    const batchSize = rowBatchInsertionSize;

    await db.transaction(async (tx) => {
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        let paramCount = 1;
        const valuesSql = [];
        const params = [];

        chunk.evaluateRows = chunk.forEach((row) => {
          const rowPlaceholders = keys.map(() => `$${paramCount++}`);
          valuesSql.push(`(${rowPlaceholders.join(", ")})`);
          keys.forEach((k) => {
            // Handle case-insensitive fallback mapping from Supabase payload
            const val =
              row[k] !== undefined
                ? row[k]
                : row[k.toLowerCase()] !== undefined
                  ? row[k.toLowerCase()]
                  : null;
            params.push(val === "" ? null : val);
          });
        });

        const sql = `INSERT INTO public.unit (${dbCols.join(", ")}) VALUES ${valuesSql.join(", ")}`;
        await tx.query(sql, params);
      }
    });

    console.log(
      `Synced all ${Object.keys(rows).length} rows successfully with native schema!`,
    );
    if (errorDiv)
      errorDiv.textContent = "Sync complete! Click 'Run Query' to load.";
    // ✅ SUCCESS: Enable the button and restore text
    if (runBtn) {
      runBtn.disabled = false;
      runBtn.textContent = "Run Query";
    }
    if (errorDiv) errorDiv.textContent = "";
  } catch (error) {
    console.error("Sync failed:", err);
    if (errorDiv) errorDiv.textContent = "Sync failed: " + err.message;
    if (runBtn) {
      runBtn.textContent = "Sync Failed (Refresh)";
    }
  }
}

let dbReadyPromise = null;

function initializeDatabase() {
  if (!dbReadyPromise) {
    dbReadyPromise = syncSupabaseToPGlite();
  }

  return dbReadyPromise;
}

// --- 3. EXECUTE SQL ---
async function executeQuery(rawQueryText = "") {
  if (!rawQueryText.trim()) return [];
  const db = await initPGlite();
  const queryText = rawQueryText.replace(/\bFROM\s+\?/i, "FROM unit");
  const result = await db.query(queryText);
  console.log("SQL result count:", result.rows.length);
  return result.rows;
}

async function handleQueryButtonClick() {
  const errorDiv = document.getElementById("errorMsg");
  errorDiv.textContent = "";
  try {
    const inputQuery = document.getElementById("sqlQuery").value;
    allResults = await executeQuery(inputQuery);
    currentPage = 1;
    renderTable();
    renderColoredTable(allResults);
    renderMatrixView2(allResults);
  } catch (err) {
    console.error("Query failed:", err);
    errorDiv.textContent = "PostgreSQL Error: " + err.message;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await initPGlite();
    await syncSupabaseToPGlite();
  } catch (e) {
    console.error("Initial sync error:", e);
  }
});

console.log("Loaded index.pglite.js");
