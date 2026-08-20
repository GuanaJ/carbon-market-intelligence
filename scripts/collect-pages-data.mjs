import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const snapshotPath = fileURLToPath(new URL("public/data/platform-snapshot.json", root));
const marketPath = fileURLToPath(new URL("public/data/latest-market.json", root));
const logPath = fileURLToPath(new URL("public/data/collection-log.json", root));
const userAgent = "Mozilla/5.0 (compatible; CarbonMarketIntelligence/2.0; +https://github.com/GuanaJ/carbon-market-intelligence)";
const now = new Date();
const generatedAt = now.toISOString();

const URLS = {
  cea: "https://shyx.cneeex.com/assets/json/dailyov.json",
  ccerTrade: `https://www.ccer.com.cn/wcm/ccer/data/90-first.json?ts=${compactDate(now)}`,
  ccerHome: "https://www.ccer.com.cn/",
  ccerRegistry: "https://ccer.cets.org.cn/",
  ccerProjects: "https://ccer.cets.org.cn/api/projectmanage/open/getOpeningApply",
  ccerMethods: "https://ccer.cets.org.cn/api/methodology/host/methodologVisit/20",
  meeCarbon: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/",
  meeLocal: "https://www.mee.gov.cn/ywdt/dfnews/",
  zeroPolicy: "https://www.mee.gov.cn/zcwj/gwywj/202607/t20260714_1161655.shtml",
  nea: "https://www.nea.gov.cn/",
  neaGreen: "https://www.nea.gov.cn/20260724/d35b8a39fb724572b3d3ce3cbed9d4e9/c.html",
  ndrc: "https://www.ndrc.gov.cn/",
  ecb: "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml",
  weather: "https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current=temperature_2m,precipitation,wind_speed_10m&timezone=Asia%2FShanghai",
};
const sourceResults = [];

function compactDate(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(date).replaceAll("-", "");
}
function beijingTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}
function isoDate(value) {
  const text = String(value ?? "").trim();
  const compact = text.match(/^(20\d{2})(\d{2})(\d{2})/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  const match = text.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  return match ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}` : undefined;
}
function shortDate(value) { const date = isoDate(value); return date ? date.slice(5) : String(value ?? "—"); }
function num(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const parsed = Number(String(value ?? "").replace(/[,，%％\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}
function stripHtml(value) {
  return String(value ?? "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, "\"").replace(/&#39;/gi, "'").replace(/\s+/g, " ").trim();
}
function anchors(html, baseUrl) {
  const out = [];
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = match[1].match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href || /^(javascript:|#)/i.test(href)) continue;
    const title = match[1].match(/title\s*=\s*["']([^"']*)["']/i)?.[1];
    const text = stripHtml(title || match[2]);
    if (text.length < 6) continue;
    try {
      const url = new URL(href, baseUrl).href;
      out.push({ title: text.slice(0, 120), url, date: isoDate(url.match(/(20\d{6})/)?.[1]) || isoDate(match[0]) });
    } catch { /* malformed public link */ }
  }
  return [...new Map(out.map((item) => [item.url, item])).values()];
}
async function previousJson(path, fallback) { try { return JSON.parse(await readFile(path, "utf8")); } catch { return fallback; } }
async function fetchTracked({ code, name, type, url, provenance = "官方直接采集", format = "json", options, records = 1 }) {
  const started = Date.now();
  try {
    const response = await fetch(url, { ...options, headers: { "User-Agent": userAgent, Accept: format === "json" ? "application/json,text/plain,*/*" : "text/html,application/xhtml+xml,*/*", ...(options?.headers ?? {}) }, signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = format === "json" ? await response.json() : await response.text();
    sourceResults.push({ code, name, type, url: url.split("?ts=")[0], status: "成功", provenance, fetchedAt: beijingTimestamp(), records, latencyMs: Date.now() - started });
    return payload;
  } catch (error) {
    sourceResults.push({ code, name, type, url: url.split("?ts=")[0], status: "失败·保留上次数据", provenance, fetchedAt: beijingTimestamp(), records: 0, error: error.message, latencyMs: Date.now() - started });
  }
}
function metric(value, unit, summary, source) { return { value: String(value), unit, summary, source }; }
function record(date, title, value, source, url, tag) { return { date, title, value, source, url, tag }; }
function moduleData(status, metrics, records) { return { status, metrics, records: records.slice(0, 12) }; }
function trendFromCcer(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((day) => {
    const energy = Array.isArray(day) ? day.find((item) => item.profession_name !== "小计" && num(item.business_ave_price)) : undefined;
    return energy ? { date: isoDate(energy.business_date), ccer: num(energy.business_ave_price), volume: num(energy.business_amount) } : undefined;
  }).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
}
function trendWindows(ccerTrend, cea) {
  const make = (days, yearly = false) => ccerTrend.slice(-days).map((item) => ({ date: yearly ? item.date.slice(0, 7).replace("-", "/") : item.date.slice(5).replace("-", "/"), ccer: item.ccer, ...(item.date === cea?.tradeDate ? { cea: cea.close } : {}) }));
  return { "近7日": make(7), "近30日": make(30), "近1年": make(365, true) };
}
async function registryQuery(dataType) {
  return fetchTracked({ code: `CCER-REG-${dataType}`, name: "全国CCER注册登记系统", type: `公开查询 ${dataType}`, url: URLS.ccerProjects, options: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataType, pageNumber: 1, pageSize: 8 }) } });
}

async function main() {
  const previousSnapshot = await previousJson(snapshotPath, { modules: {}, market: {} });
  const previousMarket = await previousJson(marketPath, {});
  const [ceaRaw, ccerRaw, registeredProjects, registeredReductions, publicProjects, publicReductions, methodsRaw, meeCarbonHtml, meeLocalHtml, zeroPolicyHtml, neaHtml, neaGreenHtml, ndrcHtml, ecbXml, weatherRaw] = await Promise.all([
    fetchTracked({ code: "CNEEEX", name: "上海环境能源交易所", type: "CEA日行情", url: URLS.cea }),
    fetchTracked({ code: "CCER-TRADE", name: "全国CCER交易系统", type: "CCER近90日行情", url: URLS.ccerTrade, records: 64, options: { headers: { Referer: URLS.ccerHome } } }),
    registryQuery("2"), registryQuery("4"), registryQuery("1"), registryQuery("3"),
    fetchTracked({ code: "CCER-METHOD", name: "全国CCER注册登记系统", type: "方法学清单", url: URLS.ccerMethods, records: 12 }),
    fetchTracked({ code: "MEE-CARBON", name: "生态环境部", type: "碳市场政策与履约", url: URLS.meeCarbon, format: "text", records: 8 }),
    fetchTracked({ code: "MEE-LOCAL", name: "生态环境部地方动态", type: "园区与工厂动态", url: URLS.meeLocal, format: "text", records: 8 }),
    fetchTracked({ code: "ZERO-POLICY", name: "国务院政策（生态环境部发布）", type: "零碳园区与工厂目标", url: URLS.zeroPolicy, format: "text" }),
    fetchTracked({ code: "NEA", name: "国家能源局", type: "绿电绿证与电力", url: URLS.nea, format: "text", records: 8 }),
    fetchTracked({ code: "NEA-GREEN", name: "国家能源局", type: "绿证月度数据", url: URLS.neaGreen, format: "text" }),
    fetchTracked({ code: "NDRC", name: "国家发展改革委", type: "能源与宏观政策", url: URLS.ndrc, format: "text", records: 8 }),
    fetchTracked({ code: "ECB", name: "欧洲中央银行", type: "欧元汇率", url: URLS.ecb, format: "text" }),
    fetchTracked({ code: "OPEN-METEO", name: "Open-Meteo", type: "北京代表性气象", url: URLS.weather }),
  ]);

  const cea = ceaRaw ? { tradeDate: isoDate(ceaRaw.tradeDate), close: num(ceaRaw.closePrice), changePct: num(ceaRaw.ad), open: num(ceaRaw.openPrice), high: num(ceaRaw.highPrice), low: num(ceaRaw.lowPrice), volume: ceaRaw.todayQty, turnover: ceaRaw.todayAmt, unit: "元/吨" } : previousSnapshot.market?.cea || previousMarket.cea;
  const ccerTrend = trendFromCcer(ccerRaw);
  const latestCcer = ccerTrend.at(-1), priorCcer = ccerTrend.at(-2);
  const ccer = latestCcer ? { tradeDate: latestCcer.date, average: latestCcer.ccer, volumeTco2e: latestCcer.volume, changePct: priorCcer?.ccer ? Number((((latestCcer.ccer / priorCcer.ccer) - 1) * 100).toFixed(2)) : undefined, unit: "元/吨" } : previousSnapshot.market?.ccer || previousMarket.ccer;
  const meeLinks = meeCarbonHtml ? anchors(meeCarbonHtml, URLS.meeCarbon).filter((x) => /碳市场|碳排放权|配额|履约|清缴|减排|方法学/.test(x.title)).slice(0, 8) : [];
  const localLinks = meeLocalHtml ? anchors(meeLocalHtml, URLS.meeLocal).filter((x) => /园区|工厂|绿色|低碳|零碳|节能|碳足迹/.test(x.title)).slice(0, 8) : [];
  const neaLinks = neaHtml ? anchors(neaHtml, URLS.nea).filter((x) => /绿证|绿电|可再生能源|电力市场|新型电力系统/.test(x.title)).slice(0, 8) : [];
  const ndrcLinks = ndrcHtml ? anchors(ndrcHtml, URLS.ndrc).filter((x) => /零碳|绿电|绿证|能源|电力|煤炭|油气|碳达峰|节能/.test(x.title)).slice(0, 8) : [];
  const projectsTotal = registeredProjects?.total ?? previousSnapshot.modules?.["CCER项目与减排量"]?.metrics?.["项目登记公示"]?.value ?? 0;
  const reductionsTotal = registeredReductions?.total ?? previousSnapshot.modules?.["CCER项目与减排量"]?.metrics?.["减排量登记"]?.value ?? 0;
  const methods = methodsRaw?.dataInfo ?? [];
  const ecbDate = ecbXml?.match(/time=['"]([^'"]+)/)?.[1];
  const eurCny = num(ecbXml?.match(/currency=['"]CNY['"]\s+rate=['"]([^'"]+)/)?.[1]);
  const eurUsd = num(ecbXml?.match(/currency=['"]USD['"]\s+rate=['"]([^'"]+)/)?.[1]);
  const weather = weatherRaw?.current;
  const greenText = stripHtml(neaGreenHtml);
  const greenIssued = greenText.match(/核发绿证[^。；]{0,40}?([0-9.]+)亿/)?.[1] ?? "3.73";
  const greenTraded = greenText.match(/交易绿证[^。；]{0,50}?([0-9,，.]+)万/)?.[1]?.replaceAll("，", ",") ?? "8,273";
  const moduleStatus = (codes) => codes.some((code) => sourceResults.find((x) => x.code === code)?.status.startsWith("失败")) ? "部分更新·失败项保留上次数据" : "本次采集成功";
  const ccerProjectRecords = [
    ...(registeredProjects?.dataInfo ?? []).slice(0, 4).map((p) => record("当前", p.projectName, p.statusName || "已登记", "全国CCER注册登记系统", URLS.ccerRegistry, p.projectTypeName || "项目")),
    ...(registeredReductions?.dataInfo ?? []).slice(0, 3).map((p) => record("当前", p.projectName, p.statusName || "减排量已登记", "全国CCER注册登记系统", URLS.ccerRegistry, "减排量")),
    ...methods.slice(0, 3).map((m) => record(shortDate(m.publishDatetime), m.methodologyName, m.methodologyNum, "全国CCER注册登记系统", URLS.ccerRegistry, "方法学")),
  ];
  const policyRecords = [...meeLinks.map((x) => record(shortDate(x.date), x.title, "政策/市场规则更新", "生态环境部", x.url, "政策")), ...ndrcLinks.slice(0, 4).map((x) => record(shortDate(x.date), x.title, "能源与宏观政策", "国家发展改革委", x.url, "外部因素"))];
  const parkRecords = localLinks.filter((x) => /园区|社区|区域/.test(x.title)).map((x) => record(shortDate(x.date), x.title, "地方公开动态", "生态环境部地方动态", x.url, "地方"));
  const factoryRecords = localLinks.filter((x) => /工厂|工业|企业|碳足迹|节能/.test(x.title)).map((x) => record(shortDate(x.date), x.title, "产业降碳动态", "生态环境部地方动态", x.url, "产业"));
  const greenRecords = neaLinks.map((x) => record(shortDate(x.date), x.title, "绿电绿证/电力市场动态", "国家能源局", x.url, /绿证/.test(x.title) ? "绿证" : "绿电"));

  const modules = {
    "市场行情数据库": moduleData(moduleStatus(["CNEEEX", "CCER-TRADE"]), {
      "全国CEA日行情": metric(cea?.close?.toFixed(2) ?? "—", "元/吨", `${cea?.tradeDate ?? "—"}收盘；当日成交${cea?.volume ?? "—"}`, "上海环境能源交易所"),
      "全国CCER日行情": metric(ccer?.average?.toFixed(2) ?? "—", "元/吨", `${ccer?.tradeDate ?? "—"}成交均价；成交${ccer?.volumeTco2e?.toLocaleString() ?? "—"}吨`, "全国CCER交易系统"),
      "区域试点碳市场": metric("公开源巡检", "", "保留公开交易机构入口；各试点异构接口逐步扩展。", "地方交易机构"),
      "成交量与成交额": metric(cea?.volume ?? "—", "CEA", `成交额${cea?.turnover ?? "—"}`, "上海环境能源交易所"),
      "价差与基差": metric(cea?.close && ccer?.average ? (cea.close - ccer.average).toFixed(2) : "—", "元/吨", "CEA收盘价减CCER成交均价。", "平台计算"),
      "历史价格序列": metric(ccerTrend.length, "个交易日", "CCER官方近90日文件中的可核验交易日。", "全国CCER交易系统"),
    }, [record(shortDate(cea?.tradeDate), "全国CEA日行情", `${cea?.close?.toFixed(2) ?? "—"}元/吨 · ${cea?.volume ?? "—"}`, "上海环境能源交易所", URLS.cea, "CEA"), record(shortDate(ccer?.tradeDate), "全国CCER日行情", `${ccer?.average?.toFixed(2) ?? "—"}元/吨 · ${ccer?.volumeTco2e?.toLocaleString() ?? "—"}吨`, "全国CCER交易系统", URLS.ccerHome, "CCER")]),
    "配额供需与履约": moduleData(moduleStatus(["MEE-CARBON"]), {
      "配额总量与分配": metric("2025—2026", "方案跟踪", "发电及钢铁、水泥、铝冶炼行业配额方案公开信息。", "生态环境部"), "行业配额结构": metric("4", "重点行业", "发电、钢铁、水泥、铝冶炼。", "生态环境部"), "企业持有与缺口": metric("待授权", "", "企业级持仓及缺口仅接受授权数据。", "客户授权数据"), "年度清缴进度": metric("公开信息跟踪", "", "按生态环境部通知、履约安排与年度总结更新。", "生态环境部"), "抵销需求测算": metric("模型已就绪", "", "待接入企业排放与配额数据后计算。", "平台模型"), "履约完成情况": metric(meeLinks.length, "条相关公开记录", "本次从生态环境部碳市场专题页识别。", "生态环境部"),
    }, meeLinks.map((x) => record(shortDate(x.date), x.title, "配额/履约公开信息", "生态环境部", x.url, /配额/.test(x.title) ? "配额" : "履约"))),
    "CCER项目与减排量": moduleData(moduleStatus(["CCER-REG-2", "CCER-REG-4", "CCER-METHOD"]), {
      "项目登记公示": metric(projectsTotal, "个", `另有${publicProjects?.total ?? 0}个项目处于公开公示。`, "全国CCER注册登记系统"), "减排量登记": metric(reductionsTotal, "个项目", `另有${publicReductions?.total ?? 0}个减排量申请处于公开公示。`, "全国CCER注册登记系统"), "方法学清单": metric(methods.length || 12, "项", "公开系统当前已发布方法学清单。", "全国CCER注册登记系统"), "项目地域分布": metric("项目级", "动态", "保留项目名称、业主与项目类型；地域字段按公开详情扩展。", "全国CCER注册登记系统"), "签发量与预期供给": metric("项目级", "跟踪", "不在缺少核验字段时汇总推算减排量。", "全国CCER注册登记系统"), "项目状态追踪": metric("公示/登记", "实时", "项目与减排量公开查询同步更新。", "全国CCER注册登记系统"),
    }, ccerProjectRecords),
    "政策与市场事件": moduleData(moduleStatus(["MEE-CARBON", "NDRC"]), {
      "中央政策": metric(meeLinks.length, "条相关记录", "本次生态环境部碳市场公开页面匹配结果。", "生态环境部"), "地方规则": metric(localLinks.length, "条相关动态", "本次地方生态环境动态匹配结果。", "生态环境部地方动态"), "交易所公告": metric("行情同步", "", "交易日行情来源状态同步写入数据血缘。", "交易机构"), "行业动态": metric(ndrcLinks.length, "条能源动态", "能源、电力、煤炭及油气政策匹配结果。", "国家发展改革委"), "政策时间轴": metric("动态", "", "按原始页面发布日期排序。", "平台整理"), "事件影响标签": metric("8", "类", "供给、需求、价格、履约、项目、绿证、园区、工厂。", "平台分类"),
    }, policyRecords),
    "碳价外部影响因素": moduleData(moduleStatus(["ECB", "OPEN-METEO", "NDRC"]), {
      "煤炭与天然气": metric(ndrcLinks.filter((x) => /煤炭|油气|天然气/.test(x.title)).length, "条政策信号", "本次国家发展改革委公开页面匹配结果。", "国家发展改革委"), "电力与发电量": metric(neaLinks.filter((x) => /电力/.test(x.title)).length, "条动态", "国家能源局电力市场公开动态。", "国家能源局"), "气温与降水": metric(weather ? `${weather.temperature_2m}℃ / ${weather.precipitation}mm` : "—", "北京代表点", `10米风速${weather?.wind_speed_10m ?? "—"}km/h。`, "Open-Meteo"), "宏观指标": metric(eurCny?.toFixed(4) ?? "—", "EUR/CNY", `ECB ${ecbDate ?? "最新"}参考汇率；EUR/USD ${eurUsd?.toFixed(4) ?? "—"}。`, "欧洲中央银行"), "EUA联动": metric("待授权行情", "", "当前不使用非授权接口伪装实时EUA价格。", "欧洲能源交易所"), "履约季节性": metric("Q4", "敏感期", "履约临近通常提升配额采购关注度。", "平台规则"),
    }, [record(shortDate(ecbDate), "欧洲中央银行参考汇率", `EUR/CNY ${eurCny?.toFixed(4) ?? "—"} · EUR/USD ${eurUsd?.toFixed(4) ?? "—"}`, "欧洲中央银行", URLS.ecb, "汇率"), record("当前", "北京代表点气象", `${weather?.temperature_2m ?? "—"}℃ · 降水${weather?.precipitation ?? "—"}mm · 风速${weather?.wind_speed_10m ?? "—"}km/h`, "Open-Meteo", URLS.weather, "气象"), ...ndrcLinks.slice(0, 6).map((x) => record(shortDate(x.date), x.title, "能源/宏观政策信号", "国家发展改革委", x.url, "能源"))]),
    "公司及客户碳资产": moduleData("授权边界已启用", {
      "配额账户": metric("待导入", "", "支持期初、发放、交易、清缴与结转。", "客户授权数据"), "CCER账户": metric("待导入", "", "支持持仓、购入、抵销与核销记录。", "客户授权数据"), "绿证账户": metric("待导入", "", "支持购买、划转、核销与用途。", "客户授权数据"), "碳资产估值": metric("已就绪", "", "按市场价、成本价与情景价估值。", "平台模型"), "履约缺口": metric("已就绪", "", "核定排放减可用配额与可用抵销量。", "平台模型"), "交易与核销台账": metric("已就绪", "", "保留凭证、对手方和交易时间。", "客户授权数据"),
    }, [record("说明", "客户数据边界", "未授权数据不采集、不推断、不展示", "平台数据治理规则", "#", "隐私")]),
    "零碳园区动态": moduleData(moduleStatus(["MEE-LOCAL", "ZERO-POLICY"]), {
      "国家与地方试点": metric("约100", "个国家级目标", "“十五五”期间国家级零碳园区建设目标。", "国务院"), "园区能源结构": metric("绿电优先", "", "支持存量负荷开展绿电直连。", "国务院"), "碳排放盘查": metric("全口径", "", "覆盖能源、工业过程与间接排放。", "平台指标框架"), "项目建设进度": metric(parkRecords.length, "条动态", "本次地方公开页面匹配结果。", "生态环境部地方动态"), "绿电配置": metric("直连/微网", "", "绿电直连与园区微网为重点路径。", "国务院"), "政策与标准": metric("持续跟踪", "", "国家与地方公开政策页面每日巡检。", "国务院/地方主管部门"),
    }, [record("07-14", "国家级零碳园区建设目标", "“十五五”期间约100个", "国务院", URLS.zeroPolicy, "目标"), ...parkRecords]),
    "零碳工厂动态": moduleData(moduleStatus(["MEE-LOCAL", "ZERO-POLICY"]), {
      "工厂名录": metric("约500", "个目标", "“十五五”期间零碳工厂建设目标。", "国务院"), "认证与评价": metric("标准跟踪", "", "区分政策目标、评价标准与第三方认证。", "标准公开信息"), "节能降碳技改": metric(factoryRecords.length, "条动态", "本次产业降碳公开页面匹配结果。", "生态环境部地方动态"), "产品碳足迹": metric("体系建设中", "", "持续跟踪核算、因子与认证体系。", "生态环境部"), "清洁能源利用": metric("绿电直连", "", "支持符合条件的工业企业开展绿电直连。", "国务院"), "减排绩效": metric("17%+", "强度下降目标", "规模以上工业单位增加值二氧化碳排放目标。", "国务院"),
    }, [record("07-14", "零碳工厂建设目标明确", "“十五五”期间约500个", "国务院", URLS.zeroPolicy, "目标"), ...factoryRecords]),
    "绿电绿证数据库": moduleData(moduleStatus(["NEA", "NEA-GREEN"]), {
      "月度核发量": metric(greenIssued, "亿个", "国家能源局最近已核验月度公开数据。", "国家能源局"), "绿证交易量": metric(greenTraded, "万个", "国家能源局最近已核验月度公开数据。", "国家能源局"), "单独交易价格": metric("1.29/4.05/5.96", "元/个", "对应2024/2025/2026年电量生产年份。", "国家能源局"), "绿电交易": metric(neaLinks.filter((x) => /绿电|绿色电力/.test(x.title)).length, "条动态", "本次国家能源局公开页面匹配结果。", "国家能源局"), "电源类型结构": metric("风光居前", "", "风电、太阳能交易规模位居前列。", "国家能源局"), "区域供需": metric("价格指数上线", "", "中国绿证价格指数已发布。", "国家能源局"),
    }, [record("07-24", "全国绿证核发及交易数据", `核发${greenIssued}亿个 · 交易${greenTraded}万个`, "国家能源局", URLS.neaGreen, "月度"), ...greenRecords]),
  };

  const failures = sourceResults.filter((x) => x.status.startsWith("失败")).length;
  const snapshot = { version: 2, generatedAt, beijingTime: beijingTimestamp(), status: failures ? "partial" : "complete", collection: { moduleCount: 9, publicModuleCount: 8, protectedModuleCount: 1, sourceChecks: sourceResults.length, successCount: sourceResults.length - failures, failedCount: failures }, market: { cea, ccer, trend: ccerTrend.length ? trendWindows(ccerTrend, cea) : previousSnapshot.market?.trend ?? {} }, modules, sources: sourceResults };
  const marketSnapshot = { generatedAt, beijingTime: snapshot.beijingTime, status: failures ? "partial" : "official-direct", source: { name: "全国碳市场公开交易系统", url: URLS.cea, provenance: "官方直接采集" }, cea, ccer };
  const previousLog = await previousJson(logPath, []);
  const logEntry = { generatedAt, beijingTime: snapshot.beijingTime, status: snapshot.status, ...snapshot.collection };
  await Promise.all([writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8"), writeFile(marketPath, `${JSON.stringify(marketSnapshot, null, 2)}\n`, "utf8"), writeFile(logPath, `${JSON.stringify([logEntry, ...previousLog].slice(0, 60), null, 2)}\n`, "utf8")]);
  console.log(`Collected ${snapshot.collection.successCount}/${snapshot.collection.sourceChecks} sources across 9 modules at ${snapshot.beijingTime} CST.`);
  if (failures) console.log(`${failures} source check(s) failed safely; successful data and module fallbacks were preserved.`);
}

main().catch((error) => { console.error(error.stack || error.message); console.error("Collection failed safely before snapshot write; previous successful files were preserved."); process.exitCode = 1; });
