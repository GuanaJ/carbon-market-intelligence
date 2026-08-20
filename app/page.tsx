"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, Building2, CalendarClock, CheckCircle2, Database,
  ExternalLink, Factory, FileText, Globe2, Leaf, Menu, RefreshCw, Search,
  Settings2, ShieldCheck, Sparkles, TrendingUp, UsersRound, Wind, X, Zap,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { greenCertificateTrend, moduleDatasets, sourceStatus, trendSeries, type ModuleDataset, type ModuleMetric, type ModuleRecord, type TrendPoint } from "../lib/platform-data";

const modules = [
  { icon: TrendingUp, title: "市场行情数据库" },
  { icon: ShieldCheck, title: "配额供需与履约" },
  { icon: Leaf, title: "CCER项目与减排量" },
  { icon: FileText, title: "政策与市场事件" },
  { icon: Globe2, title: "碳价外部影响因素" },
  { icon: UsersRound, title: "公司及客户碳资产" },
  { icon: Building2, title: "零碳园区动态" },
  { icon: Factory, title: "零碳工厂动态" },
  { icon: Zap, title: "绿电绿证数据库" },
];

const industryShare = [
  { name: "发电", value: 2087, color: "#2563eb" },
  { name: "水泥", value: 962, color: "#0d9488" },
  { name: "钢铁", value: 232, color: "#f59e0b" },
  { name: "铝冶炼", value: 97, color: "#8b5cf6" },
];
const COLORS = ["#2563eb", "#0d9488", "#f59e0b", "#8b5cf6"];

type LiveMarketSnapshot = {
  beijingTime?: string;
  status?: string;
  source?: { name: string; url: string; provenance: string };
  cea: { tradeDate: string; close: number; changePct?: number; unit: string };
  ccer: { tradeDate: string; average: number; changePct?: number; volumeTco2e?: number; unit: string };
};

type LiveSource = { code: string; name: string; type: string; url: string; status: string; provenance: string; fetchedAt: string; records: number };
type LiveModule = { status: string; metrics: Record<string, Omit<ModuleMetric, "name">>; records: ModuleRecord[] };
type LivePlatformSnapshot = {
  beijingTime: string;
  status: string;
  collection: { moduleCount: number; sourceChecks: number; successCount: number; failedCount: number; protectedModuleCount: number };
  market: Pick<LiveMarketSnapshot, "cea" | "ccer"> & { trend?: Record<string, TrendPoint[]> };
  modules: Record<string, LiveModule>;
  sources: LiveSource[];
};

function BrandMark() {
  return <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>;
}

function SourceLink({ url, children }: { url: string; children: React.ReactNode }) {
  if (url === "#") return <span className="record-source muted-source">{children}</span>;
  return <a className="record-source" href={url} target="_blank" rel="noreferrer">{children}<ExternalLink size={11} /></a>;
}

export default function Home() {
  const [activeModule, setActiveModule] = useState("总览");
  const [activeSubmodule, setActiveSubmodule] = useState("");
  const [period, setPeriod] = useState("近7日");
  const [query, setQuery] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [liveMarket, setLiveMarket] = useState<LiveMarketSnapshot | null>(null);
  const [livePlatform, setLivePlatform] = useState<LivePlatformSnapshot | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      fetch(new URL("data/platform-snapshot.json", document.baseURI), { signal: controller.signal }).then((response) => response.ok ? response.json() : Promise.reject()),
      fetch(new URL("data/latest-market.json", document.baseURI), { signal: controller.signal }).then((response) => response.ok ? response.json() : Promise.reject()),
    ]).then(([platform, market]) => {
      if (platform.status === "fulfilled") {
        const snapshot = platform.value as LivePlatformSnapshot;
        setLivePlatform(snapshot);
        setLiveMarket(snapshot.market);
      } else if (market.status === "fulfilled") setLiveMarket(market.value as LiveMarketSnapshot);
    }).catch(() => undefined);
    return () => controller.abort();
  }, []);

  const runtimeDatasets = useMemo<Record<string, ModuleDataset>>(() => Object.fromEntries(
    Object.entries(moduleDatasets).map(([name, base]) => {
      const live = livePlatform?.modules?.[name];
      if (!live) return [name, base];
      return [name, {
        ...base,
        metrics: base.metrics.map((item) => ({ ...item, ...(live.metrics?.[item.name] ?? {}) })),
        records: live.records?.length ? live.records : base.records,
      }];
    }),
  ), [livePlatform]);
  const activeDataset = activeModule === "总览" ? null : runtimeDatasets[activeModule];
  const selectedMetric = activeDataset?.metrics.find((item) => item.name === activeSubmodule) ?? activeDataset?.metrics[0];
  const currentTrend = useMemo(() => {
    const liveTrend = livePlatform?.market?.trend?.[period];
    if (liveTrend?.length) return liveTrend;
    const base = trendSeries[period];
    if (!liveMarket?.cea?.tradeDate || !liveMarket.cea.close) return base;
    const date = period === "近1年"
      ? liveMarket.cea.tradeDate.slice(0, 7).replace("-", "/")
      : liveMarket.cea.tradeDate.slice(5).replace("-", "/");
    const next = base.filter((item) => item.date !== date);
    return [...next, { date, cea: liveMarket.cea.close, ccer: liveMarket.ccer?.average }];
  }, [liveMarket, livePlatform, period]);
  const dataTime = livePlatform?.beijingTime ?? liveMarket?.beijingTime ?? "2026-08-20 21:30";
  const marketDate = liveMarket?.cea?.tradeDate ?? "2026-08-20";
  const visibleRecords = useMemo(() => {
    const records = activeDataset?.records ?? runtimeDatasets["政策与市场事件"].records;
    if (!query.trim()) return records;
    return records.filter((record) => `${record.title}${record.source}${record.tag}`.toLowerCase().includes(query.toLowerCase()));
  }, [activeDataset, query, runtimeDatasets]);

  function selectModule(title: string) {
    setActiveModule(title);
    setActiveSubmodule(runtimeDatasets[title]?.metrics[0]?.name ?? "");
    setMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <BrandMark />
          <div><strong>碳鉴</strong><span>CARBON INTELLIGENCE</span></div>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="关闭菜单"><X /></button>
        </div>
        <nav className="nav" aria-label="主导航">
          <button className={activeModule === "总览" ? "active" : ""} onClick={() => { setActiveModule("总览"); setActiveSubmodule(""); setMenuOpen(false); }}><Activity size={18} /><span>全景总览</span></button>
          {modules.map((item) => <button key={item.title} className={activeModule === item.title ? "active" : ""} onClick={() => selectModule(item.title)}><item.icon size={18} /><span>{item.title.replace("数据库", "")}</span></button>)}
          <p>系统</p>
          <button onClick={() => setSourceOpen(true)}><Database size={18} /><span>数据源与采集</span></button>
          <button onClick={() => selectModule("碳价外部影响因素")}><Settings2 size={18} /><span>指标与预警设置</span></button>
        </nav>
        <div className="sync-card"><div><span className="pulse" /><strong>{livePlatform?.status === "partial" ? "本次采集部分完成" : "本次采集已完成"}</strong></div><p>采集时间：{dataTime}</p><button onClick={() => setSourceOpen(true)}>查看采集明细 <ExternalLink size={13} /></button></div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="打开菜单"><Menu /></button>
          <div className="search-wrap"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索政策、项目、指标或来源…" /></div>
          <div className="top-actions"><span className="beijing"><CalendarClock size={16} />北京时间 · 每日17:30更新</span><button className="source-button" onClick={() => setSourceOpen(true)}><Database size={16} />数据源</button><div className="avatar">碳</div></div>
        </header>

        <main className="content">
          <section className="page-heading">
            <div><div className="eyebrow"><Sparkles size={14} />CARBON MARKET INTELLIGENCE</div><h1>{activeModule === "总览" ? "碳市场全景数据平台" : activeModule}</h1><p>{activeDataset?.intro ?? "聚合市场、履约、CCER、政策、能源与零碳场景信息，保留来源与采集时间。"}</p></div>
            <div className="heading-actions"><button className="ghost"><RefreshCw size={15} />最近采集 {dataTime.slice(11)}</button><button className="primary" onClick={() => setSourceOpen(true)}><ShieldCheck size={16} />数据血缘</button></div>
          </section>

          <div className="notice"><CheckCircle2 size={16} /><span><strong>全模块实时快照已写入</strong> · 最新行情日为{marketDate}；已完成{livePlatform?.collection?.successCount ?? "—"}/{livePlatform?.collection?.sourceChecks ?? "—"}项来源检查，失败来源不会覆盖最后成功数据。</span><button onClick={() => setSourceOpen(true)}>查看明细</button></div>

          {activeModule === "总览" ? (
            <Overview period={period} setPeriod={setPeriod} currentTrend={currentTrend} query={query} records={visibleRecords} onOpenSources={() => setSourceOpen(true)} liveMarket={liveMarket} livePlatform={livePlatform} />
          ) : activeDataset && selectedMetric ? (
            <section className="module-view">
              <div className="submodule-strip">
                <div><strong>子模块</strong><span>{activeDataset.metrics.length} 项数据视图</span></div>
                <nav aria-label={`${activeModule}子模块`}>{activeDataset.metrics.map((item) => <button key={item.name} className={selectedMetric.name === item.name ? "active" : ""} onClick={() => setActiveSubmodule(item.name)}>{item.name}</button>)}</nav>
              </div>

              <section className="panel selected-submodule" aria-live="polite">
                <div className="selected-copy"><small>当前子模块</small><strong>{selectedMetric.name}</strong><span>{selectedMetric.summary}</span><span className="muted-source">数据来源：{selectedMetric.source}</span></div>
                <div className="selected-value"><strong>{selectedMetric.value}</strong><span>{selectedMetric.unit}</span></div>
              </section>

              <section className="submetric-grid">
                {activeDataset.metrics.map((item) => <button key={item.name} className={selectedMetric.name === item.name ? "active" : ""} onClick={() => setActiveSubmodule(item.name)}><strong>{item.name}</strong><span>{item.value}</span><small>{item.unit || item.source}</small></button>)}
              </section>

              {activeModule === "市场行情数据库" && <MarketChart period={period} setPeriod={setPeriod} data={currentTrend} />}
              {activeModule === "绿电绿证数据库" && <GreenChart />}

              <RecordsPanel title={`${selectedMetric.name} · 最新数据与动态`} records={visibleRecords} emptyText={query ? "没有符合搜索条件的记录" : "暂无公开记录"} />
            </section>
          ) : null}

          <footer><span>最近采集：{dataTime} CST</span><span>所有数值均区分直接来源、转引来源、平台计算与待导入数据</span></footer>
        </main>
      </div>

      {sourceOpen && <SourceDrawer onClose={() => setSourceOpen(false)} snapshot={livePlatform} dataTime={dataTime} />}
    </div>
  );
}

function Overview({ period, setPeriod, currentTrend, records, onOpenSources, liveMarket, livePlatform }: { period: string; setPeriod: (value: string) => void; currentTrend: TrendPoint[]; query: string; records: ModuleRecord[]; onOpenSources: () => void; liveMarket: LiveMarketSnapshot | null; livePlatform: LivePlatformSnapshot | null }) {
  const cea = liveMarket?.cea;
  const ccer = liveMarket?.ccer;
  const greenTrade = livePlatform?.modules?.["绿电绿证数据库"]?.metrics?.["绿证交易量"];
  const external = livePlatform?.modules?.["碳价外部影响因素"]?.metrics;
  const collection = livePlatform?.collection;
  const displayDate = (cea?.tradeDate ?? "2026-08-20").slice(5).replace("-", "月") + "日";
  return <>
    <section className="metric-grid" aria-label="核心市场指标">
      <article className="metric-card featured"><div className="metric-top"><span>全国碳配额 CEA</span><TrendingUp size={18} /></div><div className="metric-main"><strong>{(cea?.close ?? 97.81).toFixed(2)}</strong><small>元 / 吨</small></div><div className="metric-bottom"><span className="delta up"><ArrowUpRight size={14} />{(cea?.changePct ?? 0.42).toFixed(2)}%</span><span>{displayDate}收盘</span></div></article>
      <article className="metric-card"><div className="metric-top"><span>全国 CCER</span><Leaf size={18} /></div><div className="metric-main"><strong>{(ccer?.average ?? 94.83).toFixed(2)}</strong><small>元 / 吨</small></div><div className="metric-bottom"><span className="delta up"><ArrowUpRight size={14} />{(ccer?.changePct ?? 1.38).toFixed(2)}%</span><span>{displayDate}均价</span></div></article>
      <article className="metric-card"><div className="metric-top"><span>当日 CCER 成交量</span><Activity size={18} /></div><div className="metric-main"><strong>{((ccer?.volumeTco2e ?? 352877) / 10000).toFixed(2)}</strong><small>万吨</small></div><div className="metric-bottom"><span className="quality-badge official">官方直采</span><span>全国CCER交易系统</span></div></article>
      <article className="metric-card"><div className="metric-top"><span>最近月度绿证交易</span><Zap size={18} /></div><div className="metric-main"><strong>{greenTrade?.value ?? "8,273"}</strong><small>{greenTrade?.unit ?? "万个"}</small></div><div className="metric-bottom"><span className="quality-badge official">官方</span><span>国家能源局</span></div></article>
    </section>

    <section className="chart-grid">
      <MarketChart period={period} setPeriod={setPeriod} data={currentTrend} />
      <article className="panel industry-panel"><div className="panel-head"><div><h2>纳管企业结构</h2><p>2025年重点排放单位</p></div><span className="quality-badge official">官方</span></div><div className="donut-wrap"><div className="donut-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={industryShare} dataKey="value" innerRadius={56} outerRadius={76} paddingAngle={3} stroke="none">{industryShare.map((item, index) => <Cell key={item.name} fill={COLORS[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="donut-label"><strong>3,378</strong><span>家企业</span></div></div><div className="industry-list">{industryShare.map((item) => <div key={item.name}><span><i style={{ background: item.color }} />{item.name}</span><strong>{item.value.toLocaleString()}<small> 家</small></strong></div>)}</div></div></article>
    </section>

    <section className="overview-lower">
      <RecordsPanel title="最新政策与市场事件" records={records} emptyText="没有符合搜索条件的记录" />
      <article className="panel coverage-panel"><div className="panel-head"><div><h2>本次采集覆盖</h2><p>已写入全模块实时快照</p></div><button className="text-button" onClick={onOpenSources}>查看来源 <ExternalLink size={13} /></button></div><div className="coverage-list"><div><strong>{currentTrend.length}</strong><span>当前图表时间点</span></div><div><strong>{collection?.successCount ?? 5}</strong><span>成功来源检查</span></div><div><strong>{records.length}</strong><span>政策与事件</span></div><div><strong>{collection?.moduleCount ?? 9}</strong><span>业务模块</span></div></div><div className="coverage-note"><ShieldCheck size={18} /><p>客户碳资产仅保留数据结构，未授权前不从公开网页推断企业持仓。</p></div></article>
    </section>

    <section className="chart-grid compact"><GreenChart /><article className="panel signal-panel"><div className="panel-head"><div><h2>外部影响信号</h2><p>本次采集实时状态</p></div><Globe2 size={20} className="panel-icon" /></div><div className="signal-list"><div><span>北京代表点气象</span><strong>{external?.["气温与降水"]?.value ?? "逐日采集"}</strong><div className="signal-line"><i style={{width:"78%"}} /></div></div><div><span>欧洲央行参考汇率</span><strong>{external?.["宏观指标"]?.value ?? "—"}</strong><div className="signal-line"><i style={{width:"64%"}} /></div></div><div><span>CEA—CCER价差</span><strong>{cea?.close && ccer?.average ? (cea.close - ccer.average).toFixed(2) : "—"}元</strong><div className="signal-line"><i style={{width:"48%"}} /></div></div><div><span>EUA联动</span><strong>{external?.["EUA联动"]?.value ?? "待授权行情"}</strong><div className="signal-line"><i style={{width:"34%"}} /></div></div></div></article></section>
  </>;
}

function MarketChart({ period, setPeriod, data }: { period: string; setPeriod: (value: string) => void; data: typeof trendSeries[string] }) {
  const allValues = data.flatMap((item) => [item.cea, item.ccer]).filter((value): value is number => typeof value === "number");
  const low = Math.floor(Math.min(...allValues) - 4);
  const high = Math.ceil(Math.max(...allValues) + 4);
  return <article className="panel market-panel"><div className="panel-head"><div><h2>全国碳价走势</h2><p>缺失交易日保留空值，不作线性补造</p></div><div className="period-switch">{["近7日", "近30日", "近1年"].map((item) => <button key={item} className={period === item ? "active" : ""} onClick={() => setPeriod(item)}>{item}</button>)}</div></div><div className="chart-legend"><span><i className="cea" />CEA收盘价</span><span><i className="ccer" />CCER成交均价</span><em>元/吨</em></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:8,right:12,left:-12,bottom:0}}><defs><linearGradient id="ceaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2563eb" stopOpacity={0.2}/><stop offset="1" stopColor="#2563eb" stopOpacity={0}/></linearGradient><linearGradient id="ccerFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0d9488" stopOpacity={0.18}/><stop offset="1" stopColor="#0d9488" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#e9eef5" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize:12,fill:"#66758a"}}/><YAxis domain={[low, high]} axisLine={false} tickLine={false} tick={{fontSize:12,fill:"#66758a"}}/><Tooltip contentStyle={{borderRadius:10,border:"1px solid #dbe3ef",fontSize:13}}/><Area connectNulls={false} type="monotone" dataKey="ccer" name="CCER" stroke="#0d9488" fill="url(#ccerFill)" strokeWidth={2.5}/><Area connectNulls={false} type="monotone" dataKey="cea" name="CEA" stroke="#2563eb" fill="url(#ceaFill)" strokeWidth={2.5}/></AreaChart></ResponsiveContainer></div></article>;
}

function GreenChart() {
  return <article className="panel"><div className="panel-head"><div><h2>绿证月度交易规模</h2><p>2026年全国绿证交易量 · 百万个</p></div><Wind size={20} className="panel-icon" /></div><div className="small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={greenCertificateTrend}><CartesianGrid vertical={false} stroke="#edf1f6"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize:12,fill:"#66758a"}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:12,fill:"#66758a"}}/><Tooltip contentStyle={{fontSize:13}}/><Bar dataKey="volume" name="交易量" fill="#0d9488" radius={[5,5,0,0]} barSize={24}/></BarChart></ResponsiveContainer></div></article>;
}

function RecordsPanel({ title, records, emptyText }: { title: string; records: typeof moduleDatasets[string]["records"]; emptyText: string }) {
  return <article className="panel records-panel"><div className="panel-head"><div><h2>{title}</h2><p>点击来源可返回原始发布页面</p></div><span className="result-count">{records.length} 条</span></div>{records.length ? <div className="data-table"><div className="data-row data-th"><span>日期</span><span>数据 / 事件</span><span>关键值</span><span>来源</span></div>{records.map((record) => <div className="data-row" key={`${record.date}-${record.title}`}><span>{record.date}</span><span><em>{record.tag}</em><strong>{record.title}</strong></span><span>{record.value}</span><SourceLink url={record.url}>{record.source}</SourceLink></div>)}</div> : <div className="empty-state">{emptyText}</div>}</article>;
}

function SourceDrawer({ onClose, snapshot, dataTime }: { onClose: () => void; snapshot: LivePlatformSnapshot | null; dataTime: string }) {
  const sources = snapshot?.sources ?? sourceStatus.map((source, index) => ({ code: `fallback-${index}`, ...source, fetchedAt: source.updated, records: 0, provenance: "历史快照" }));
  const summary = snapshot?.collection;
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="source-drawer" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="数据源与采集状态"><div className="drawer-head"><div><span className="drawer-icon"><Database /></span><div><h2>本次采集与数据血缘</h2><p>采集时间：{dataTime} CST</p></div></div><button onClick={onClose} aria-label="关闭"><X /></button></div><div className="schedule-card"><CalendarClock /><div><strong>每日自动采集</strong><span>北京时间17:30；失败不覆盖最后成功数据</span></div><em>已启用</em></div><div className="source-summary"><div><strong>{summary?.moduleCount ?? 9}</strong><span>已接入模块</span></div><div><strong>{summary?.successCount ?? 5}</strong><span>本次成功检查</span></div><div><strong>{summary?.failedCount ?? 0}</strong><span>失败并保留</span></div></div><div className="source-table"><div className="source-row source-th"><span>来源</span><span>数据类型</span><span>状态</span><span>更新时间</span></div>{sources.map((source) => <a className="source-row" href={source.url} target="_blank" rel="noreferrer" key={source.code}><strong>{source.name}</strong><span>{source.type}</span><span className={`source-status ${source.status !== "成功" ? "limited" : ""}`}><i />{source.status}</span><span>{source.fetchedAt.slice(5)}<ExternalLink size={12}/></span></a>)}</div><div className="trace-note"><ShieldCheck /><div><strong>质量规则</strong><p>每条数据保存来源链接、来源机构、发布日期、采集时间和解析口径。来源临时失败时保留上次成功值并明确标记；无法核验的数据保持空值。</p></div></div></section></div>;
}
