import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const sourceUrl = "https://shyx.cneeex.com/assets/json/dailyov.json";
const outputPath = fileURLToPath(new URL("../public/data/latest-market.json", import.meta.url));

function collectObjects(value, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectObjects(item, out);
  } else if (value && typeof value === "object") {
    out.push(value);
    for (const item of Object.values(value)) collectObjects(item, out);
  }
  return out;
}

function pick(object, patterns) {
  for (const [key, value] of Object.entries(object)) {
    if (patterns.some((pattern) => pattern.test(key)) && value !== "" && value != null) return value;
  }
}

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const parsed = Number(value.replace(/[,，%％\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeDate(value) {
  const text = String(value ?? "").trim();
  const match = text.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (!match) return undefined;
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function findLatestQuote(payload) {
  const candidates = collectObjects(payload).map((item) => ({
    tradeDate: normalizeDate(pick(item, [/trade.*date/i, /date/i, /日期/, /交易日/])),
    close: toNumber(pick(item, [/close/i, /收盘/, /综合价格/, /成交均价/])),
    changePct: toNumber(pick(item, [/change.*pct/i, /涨跌幅/, /涨幅/])),
  })).filter((item) => item.tradeDate && typeof item.close === "number" && item.close > 0);

  candidates.sort((a, b) => b.tradeDate.localeCompare(a.tradeDate));
  return candidates[0];
}

function beijingTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day} ${value.hour}:${value.minute}`;
}

async function main() {
  const previous = JSON.parse(await readFile(outputPath, "utf8"));
  const response = await fetch(sourceUrl, {
    headers: { "User-Agent": "CarbonMarketIntelligence/1.0 (+https://github.com/GuanaJ/carbon-market-intelligence)" },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`CEA source returned HTTP ${response.status}`);

  const quote = findLatestQuote(await response.json());
  if (!quote) throw new Error("No verifiable CEA quote was found; previous successful snapshot is preserved.");

  const next = {
    ...previous,
    generatedAt: new Date().toISOString(),
    beijingTime: beijingTimestamp(),
    status: "official-direct",
    source: { name: "上海环境能源交易所", url: sourceUrl, provenance: "官方直接采集" },
    cea: {
      ...previous.cea,
      tradeDate: quote.tradeDate,
      close: quote.close,
      ...(typeof quote.changePct === "number" ? { changePct: quote.changePct } : {}),
    },
  };
  await writeFile(outputPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log(`Updated CEA ${next.cea.tradeDate}: ${next.cea.close}`);
}

main().catch((error) => {
  console.error(error.message);
  console.error("Collection failed safely: the last successful snapshot was not overwritten.");
  process.exitCode = 1;
});
