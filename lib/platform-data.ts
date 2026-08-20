export type TrendPoint = { date: string; cea?: number; ccer?: number };

export const trendSeries: Record<string, TrendPoint[]> = {
  "近7日": [
    { date: "08/12", ccer: 92.08 },
    { date: "08/13", ccer: 96.34 },
    { date: "08/14", ccer: 96.4 },
    { date: "08/18", ccer: 96.2 },
    { date: "08/20", cea: 97.81, ccer: 94.83 },
  ],
  "近30日": [
    { date: "07/31", ccer: 94.92 },
    { date: "08/03", ccer: 92.18 },
    { date: "08/04", ccer: 94.42 },
    { date: "08/06", ccer: 93.28 },
    { date: "08/07", ccer: 94.01 },
    { date: "08/10", ccer: 83.67 },
    { date: "08/11", ccer: 95.71 },
    { date: "08/12", ccer: 92.08 },
    { date: "08/13", ccer: 96.34 },
    { date: "08/14", ccer: 96.4 },
    { date: "08/18", ccer: 96.2 },
    { date: "08/20", cea: 97.81, ccer: 94.83 },
  ],
  "近1年": [
    { date: "2025/09", ccer: 71.14 },
    { date: "2025/10", ccer: 70.77 },
    { date: "2025/11", ccer: 59.04 },
    { date: "2025/12", cea: 74.63, ccer: 76.5 },
    { date: "2026/04", ccer: 83.5 },
    { date: "2026/05", ccer: 83.54 },
    { date: "2026/06", ccer: 82.81 },
    { date: "2026/07", ccer: 94.92 },
    { date: "2026/08", cea: 97.81, ccer: 94.83 },
  ],
};

export type ModuleMetric = { name: string; value: string; unit: string; summary: string; source: string };
export type ModuleRecord = { date: string; title: string; value: string; source: string; url: string; tag: string };
export type ModuleDataset = { intro: string; metrics: ModuleMetric[]; records: ModuleRecord[] };

const MEE = "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/";
const NEA_JUNE = "https://www.nea.gov.cn/20260724/d35b8a39fb724572b3d3ce3cbed9d4e9/c.html";
const CETS = "https://ccer.cets.org.cn/";
const MARKET = "https://www.ccn.ac.cn/cets";

export const moduleDatasets: Record<string, ModuleDataset> = {
  "市场行情数据库": {
    intro: "覆盖全国CEA、全国CCER、地方试点及国际市场。当前日度数据截至2026年8月20日。",
    metrics: [
      { name: "全国CEA日行情", value: "97.81", unit: "元/吨", summary: "8月20日收盘价，涨幅0.42%。", source: "上海环交所转引" },
      { name: "地方试点市场", value: "37–39", unit: "元/吨", summary: "广东7月成交均价区间；各试点口径分别展示。", source: "月度市场报告" },
      { name: "CCER交易行情", value: "94.83", unit: "元/吨", summary: "8月20日成交35.29万吨，成交额3346.29万元。", source: "北京绿交所转引" },
      { name: "EUA及国际市场", value: "79–87", unit: "欧元/吨", summary: "EUA Dec-26 7月观察区间。", source: "EEX市场观察" },
      { name: "成交结构与流动性", value: "35.29", unit: "万吨", summary: "8月20日CCER日成交量。", source: "北京绿交所转引" },
      { name: "价格对比与价差", value: "2.98", unit: "元/吨", summary: "8月20日CEA收盘价减CCER成交均价。", source: "平台计算" },
    ],
    records: [
      { date: "08-20", title: "全国CEA综合价格行情", value: "收盘97.81元/吨 · +0.42%", source: "上海环境能源交易所（转引）", url: MARKET, tag: "CEA" },
      { date: "08-20", title: "全国CCER交易行情", value: "均价94.83元/吨 · 352,877吨", source: "北京绿色交易所（转引）", url: MARKET, tag: "CCER" },
      { date: "07-31", title: "7月全国碳市场月度观察", value: "CEA 1,726.02万吨 · CCER 267.16万吨", source: "公开市场月报", url: "https://www.yicai.com/news/103324108.html", tag: "月报" },
    ],
  },
  "配额供需与履约": {
    intro: "跟踪配额方案、纳管范围、年度清缴、CCER抵销需求及行业履约风险。",
    metrics: [
      { name: "配额总量与分配", value: "4", unit: "行业", summary: "2026年度发电、钢铁、水泥、铝冶炼配额方案正在完善。", source: "生态环境部" },
      { name: "行业盈缺测算", value: "待核定", unit: "", summary: "待年度核查与最终配额方案发布后计算。", source: "平台模型" },
      { name: "企业履约进度", value: "年度", unit: "跟踪", summary: "按省级主管部门与交易系统公告更新。", source: "生态环境部" },
      { name: "CCER抵销需求", value: "制度", unit: "跟踪", summary: "记录可抵销比例、限制条件与企业缺口。", source: "生态环境部" },
      { name: "履约风险预警", value: "3级", unit: "预警", summary: "按缺口、剩余天数与流动性分级。", source: "平台规则" },
      { name: "历史清缴结果", value: "高位", unit: "完成率", summary: "全国碳市场清缴完成率保持较高水平。", source: "生态环境部" },
    ],
    records: [
      { date: "07-27", title: "2025—2026年度配额总量和分配方案征求意见", value: "覆盖发电、钢铁、水泥、铝冶炼", source: "生态环境部", url: MEE, tag: "配额" },
      { date: "02-09", title: "做好2026年全国碳市场有关工作的通知", value: "核算、核查、配额与清缴工作安排", source: "生态环境部", url: MEE, tag: "履约" },
      { date: "2025", title: "全国重点排放单位结构", value: "3,378家", source: "生态环境部", url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/202601/t20260101_1139528.shtml", tag: "纳管" },
    ],
  },
  "CCER项目与减排量": {
    intro: "跟踪项目公示、项目登记、减排量登记、方法学、地域分布及潜在供给。",
    metrics: [
      { name: "项目登记公示", value: "41", unit: "个", summary: "截至2026年7月底的公开登记项目统计。", source: "CCER公开信息" },
      { name: "减排量登记", value: "21", unit: "个项目", summary: "已登记减排量项目，覆盖7个省份。", source: "CCER公开信息" },
      { name: "方法学清单", value: "12", unit: "项", summary: "含造林、海上风电、光热、氢能等领域。", source: "生态环境部" },
      { name: "项目地域分布", value: "7", unit: "省份", summary: "广东、福建、山东、甘肃、江苏、青海、新疆。", source: "CCER公开信息" },
      { name: "签发量与预期供给", value: "8,898", unit: "万吨", summary: "21个项目预计计入期总减排量。", source: "CCER公开信息" },
      { name: "项目状态追踪", value: "6", unit: "阶段", summary: "公示、审定、登记、监测、核查、减排量登记。", source: "平台分类" },
    ],
    records: [
      { date: "08-13", title: "3项CCER方法学公开征求意见", value: "更新造林碳汇等方法学", source: "生态环境部", url: MEE, tag: "方法学" },
      { date: "07-31", title: "已登记项目与减排量更新", value: "41个项目；21个项目登记减排量", source: "CCER公开信息汇总", url: MARKET, tag: "登记" },
      { date: "持续", title: "CCER项目公示与减排量公示", value: "按公开系统状态追踪", source: "全国CCER注册登记系统", url: CETS, tag: "公示" },
    ],
  },
  "政策与市场事件": {
    intro: "按中央政策、地方规则、交易所公告和市场事件组织，支持时间轴与影响标签。",
    metrics: [
      { name: "中央政策", value: "6", unit: "条新增", summary: "本次采集新增重点中央政策与解释。", source: "国务院/部委" },
      { name: "地方规则", value: "3", unit: "条跟踪", summary: "零碳园区、地方碳市场及绿电政策。", source: "地方主管部门" },
      { name: "交易所公告", value: "5", unit: "类", summary: "行情、交易安排、竞价、系统与结算公告。", source: "交易机构" },
      { name: "行业动态", value: "4", unit: "类", summary: "扩围、履约、CCER、绿证市场。", source: "权威公开信息" },
      { name: "政策时间轴", value: "2026", unit: "年度", summary: "按发布日期与生效日期双轴组织。", source: "平台整理" },
      { name: "事件影响标签", value: "8", unit: "标签", summary: "供给、需求、价格、履约、项目、绿证、园区、工厂。", source: "平台分类" },
    ],
    records: [
      { date: "08-13", title: "CCER方法学更新征求意见", value: "影响项目开发与未来供给", source: "生态环境部", url: MEE, tag: "CCER" },
      { date: "07-27", title: "配额总量和分配方案征求意见", value: "影响四行业配额供需", source: "生态环境部", url: MEE, tag: "配额" },
      { date: "07-24", title: "中国绿证价格指数正式发布", value: "增强绿证价格透明度", source: "国家能源局", url: "https://www.nea.gov.cn/20260724/4d71258a5059496083795293690923dd/c.html", tag: "绿证" },
      { date: "07-14", title: "“十五五”碳达峰行动方案", value: "提出约100个零碳园区、500个零碳工厂", source: "国务院", url: "https://www.mee.gov.cn/zcwj/gwywj/202607/t20260714_1161655.shtml", tag: "零碳" },
    ],
  },
  "碳价外部影响因素": {
    intro: "监测能源、电力、气象、宏观、国际碳价与履约季节性，不把相关性直接解释为因果。",
    metrics: [
      { name: "煤炭与天然气", value: "日度", unit: "待接", summary: "预留动力煤与天然气价格序列。", source: "能源市场" },
      { name: "电力与发电量", value: "36,848", unit: "亿千瓦时", summary: "2026年上半年全国电力市场交易电量。", source: "国家能源局" },
      { name: "气温与降水", value: "逐日", unit: "待接", summary: "用于解释火电需求与配额需求变化。", source: "气象部门" },
      { name: "宏观指标", value: "+24.2%", unit: "同比", summary: "上半年电力市场交易电量同比增幅。", source: "国家能源局" },
      { name: "EUA联动", value: "79–87", unit: "欧元/吨", summary: "EUA Dec-26 7月观察区间。", source: "国际市场观察" },
      { name: "履约季节性", value: "Q4", unit: "敏感期", summary: "履约临近通常提升配额采购关注度。", source: "平台规则" },
    ],
    records: [
      { date: "07-30", title: "上半年全国电力市场交易电量", value: "36,848亿千瓦时 · 同比+24.2%", source: "国家能源局", url: "https://www.nea.gov.cn/20260730/3ce671c387574eeeb120fc3825be0399/c.html", tag: "电力" },
      { date: "07月", title: "EUA Dec-26市场观察", value: "79–87欧元/吨区间", source: "公开市场月报", url: "https://www.ideacarbon.org/news_free/68405/", tag: "EUA" },
      { date: "07月", title: "CEA与CCER同步上行", value: "政策收紧预期与履约需求共同影响", source: "公开市场月报", url: "https://www.yicai.com/news/103324108.html", tag: "联动" },
    ],
  },
  "公司及客户碳资产": {
    intro: "该模块只接受经授权的企业数据；本次不使用公开网页推断客户持仓或履约缺口。",
    metrics: [
      { name: "配额账户", value: "待导入", unit: "", summary: "支持期初、发放、交易、清缴与结转。", source: "客户授权数据" },
      { name: "CCER账户", value: "待导入", unit: "", summary: "支持持仓、购入、抵销与核销记录。", source: "客户授权数据" },
      { name: "绿证账户", value: "待导入", unit: "", summary: "支持购买、划转、核销与用途。", source: "客户授权数据" },
      { name: "碳资产估值", value: "已就绪", unit: "", summary: "按市场价、成本价与情景价估值。", source: "平台模型" },
      { name: "履约缺口", value: "已就绪", unit: "", summary: "核定排放减可用配额与可用抵销量。", source: "平台模型" },
      { name: "交易与核销台账", value: "已就绪", unit: "", summary: "保留凭证、对手方和交易时间。", source: "客户授权数据" },
    ],
    records: [
      { date: "说明", title: "客户数据边界", value: "未授权数据不采集、不推断、不展示", source: "平台数据治理规则", url: "#", tag: "隐私" },
      { date: "模板", title: "企业碳资产导入结构", value: "CEA / CCER / 绿证 / 履约义务", source: "平台数据模型", url: "#", tag: "导入" },
    ],
  },
  "零碳园区动态": {
    intro: "跟踪国家和地方试点、能源结构、碳盘查、建设进度、绿电配置及政策标准。",
    metrics: [
      { name: "国家与地方试点", value: "约100", unit: "个目标", summary: "“十五五”期间国家级零碳园区建设目标。", source: "国务院" },
      { name: "园区能源结构", value: "绿电", unit: "优先", summary: "支持存量负荷开展绿电直连。", source: "国务院" },
      { name: "碳排放盘查", value: "全口径", unit: "", summary: "覆盖能源、工业过程与间接排放。", source: "平台指标框架" },
      { name: "项目建设进度", value: "动态", unit: "跟踪", summary: "规划、开工、投产、验收分阶段。", source: "地方公开信息" },
      { name: "绿电配置", value: "直连", unit: "模式", summary: "绿电直连与园区微网成为重点路径。", source: "国务院" },
      { name: "政策与标准", value: "指南", unit: "待发布", summary: "跟踪国家级零碳园区建设指南。", source: "国务院" },
    ],
    records: [
      { date: "07-14", title: "国家级零碳园区建设目标", value: "“十五五”期间约100个", source: "国务院", url: "https://www.mee.gov.cn/zcwj/gwywj/202607/t20260714_1161655.shtml", tag: "目标" },
      { date: "07-01", title: "浙江推进园区低碳零碳改造", value: "碳账户与一企一策协同推进", source: "浙江省公开信息", url: "https://www.mee.gov.cn/ywdt/dfnews/202607/t20260701_1160604.shtml", tag: "地方" },
      { date: "01-14", title: "海南零碳园区与零碳社区布局", value: "巩固博鳌零碳示范区成果", source: "海南省公开信息", url: "https://www.mee.gov.cn/ywdt/dfnews/202601/t20260114_1140640.shtml", tag: "示范" },
    ],
  },
  "零碳工厂动态": {
    intro: "跟踪工厂名录、评价认证、节能降碳技改、产品碳足迹与清洁能源利用。",
    metrics: [
      { name: "工厂名录", value: "约500", unit: "个目标", summary: "“十五五”期间零碳工厂建设目标。", source: "国务院" },
      { name: "认证与评价", value: "标准", unit: "跟踪", summary: "区分政策目标、评价标准与第三方认证。", source: "标准公开信息" },
      { name: "节能降碳技改", value: "1.5", unit: "亿吨标煤", summary: "重点行业改造节能量目标。", source: "国务院" },
      { name: "产品碳足迹", value: "体系", unit: "建设中", summary: "与供应链和出口场景联动。", source: "生态环境部" },
      { name: "清洁能源利用", value: "绿电", unit: "直连", summary: "支持符合条件的工业企业开展绿电直连。", source: "国务院" },
      { name: "减排绩效", value: "17%+", unit: "强度下降", summary: "规模以上工业单位增加值二氧化碳排放目标。", source: "国务院" },
    ],
    records: [
      { date: "07-14", title: "零碳工厂建设目标明确", value: "“十五五”期间约500个", source: "国务院", url: "https://www.mee.gov.cn/zcwj/gwywj/202607/t20260714_1161655.shtml", tag: "目标" },
      { date: "04-22", title: "更高水平推进节能降碳", value: "强化技术改造与数字化转型", source: "中办、国办", url: "https://www.mee.gov.cn/zcwj/zyygwj/202604/t20260422_1149910.shtml", tag: "技改" },
      { date: "06-17", title: "产品碳足迹管理体系建设进展", value: "持续完善核算、因子与认证体系", source: "生态环境部", url: MEE, tag: "碳足迹" },
    ],
  },
  "绿电绿证数据库": {
    intro: "跟踪绿证核发、交易、价格、电源结构、绿电交易与电碳证衔接。",
    metrics: [
      { name: "月度核发量", value: "3.73", unit: "亿个", summary: "2026年6月核发绿证。", source: "国家能源局" },
      { name: "绿证交易量", value: "8,273", unit: "万个", summary: "2026年6月全国绿证交易量。", source: "国家能源局" },
      { name: "单独交易价格", value: "1.29/4.05/5.96", unit: "元/个", summary: "对应2024/2025/2026年电量生产年份。", source: "国家能源局" },
      { name: "绿电交易", value: "4,289", unit: "万个绿证", summary: "2026年6月绿色电力交易对应绿证。", source: "国家能源局" },
      { name: "电源类型结构", value: "风光", unit: "居前", summary: "风电、太阳能交易规模位居前两位。", source: "国家能源局" },
      { name: "区域供需", value: "指数", unit: "上线", summary: "中国绿证价格指数已于7月发布。", source: "国家能源局" },
    ],
    records: [
      { date: "07-24", title: "2026年6月绿证核发及交易数据", value: "核发3.73亿个 · 交易8,273万个", source: "国家能源局", url: NEA_JUNE, tag: "月度" },
      { date: "07-24", title: "中国绿证价格指数发布", value: "增强市场价格透明度", source: "国家能源局", url: "https://www.nea.gov.cn/20260724/4d71258a5059496083795293690923dd/c.html", tag: "指数" },
      { date: "07-30", title: "扩大绿电应用与电碳证衔接", value: "上半年绿电交易1,641亿千瓦时", source: "国家能源局", url: "https://www.nea.gov.cn/20260730/9182841d27fe49ae829d672ea35d7a91/c.html", tag: "绿电" },
    ],
  },
};

export const greenCertificateTrend = [
  { month: "1月", volume: 102.06 }, { month: "2月", volume: 75.48 }, { month: "3月", volume: 62.55 },
  { month: "4月", volume: 71.1 }, { month: "5月", volume: 33.88 }, { month: "6月", volume: 82.73 },
];

export const sourceStatus = [
  { name: "全国CCER交易系统", type: "CCER日行情", status: "成功", updated: "08-20", url: "https://www.ccer.com.cn/" },
  { name: "生态环境部", type: "政策 / 配额 / 方法学", status: "成功", updated: "08-20", url: MEE },
  { name: "国家能源局", type: "绿电绿证 / 电力", status: "成功", updated: "08-20", url: "https://www.nea.gov.cn/" },
  { name: "CCER注册登记系统", type: "项目 / 减排量", status: "成功", updated: "08-20", url: CETS },
  { name: "全国碳市场行情汇总", type: "CEA / CCER转引", status: "成功", updated: "08-20", url: MARKET },
  { name: "上海环境能源交易所", type: "CEA直接采集", status: "受限", updated: "已转引", url: "https://www.cneeex.com/" },
  { name: "地方试点交易所", type: "地方市场", status: "扩展中", updated: "月度", url: "https://www.cnemission.com/" },
];
