// ==UserScript==
// @name         QQ 音乐歌单导入器
// @namespace    https://github.com/pangy9/qq-playlist-importer
// @version      0.3.6
// @author       pangy9
// @license      MIT
// @description  按 CSV 分类批量导入歌曲到 QQ 音乐歌单（逐首打开详情页模拟点击添加，断点续跑）
// @match        https://y.qq.com/*
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
'use strict';

// 同一页面执行环境只初始化一次；仍要求单标签页、同一 QQ 账号运行。
if (globalThis.__qqPlaylistImporterActive) return;
globalThis.__qqPlaylistImporterActive = true;

// === PURE:BEGIN ===
// （纯函数区：Node 测试通过 tests/helpers.js 抽取此段直接测试）
const UI_LANG = 'zh';
const UI_EN = {
  "CSV 每行列数必须与表头一致": "Every CSV row must have the same number of columns as the header",
  "CSV 缺少必需表头：QQ歌曲ID、建议主类别": "Missing required CSV headers: QQ歌曲ID, 建议主类别",
  "日志识别字段损坏或歌曲ID/目标已改变，请使用完整原日志": "Log metadata is damaged or the song ID/target changed. Use the complete original log.",
  "日志项不是失败或未执行，已跳过": "Not failed or pending; skipped",
  "缺少QQ歌曲ID": "Missing QQ歌曲ID",
  "歌曲状态:": "Song unavailable: ",
  "缺少建议主类别": "Missing 建议主类别",
  "额外说唱歌单名不能为空": "The additional rap playlist name cannot be empty",
  "操作成功": "Operation completed",
  "失败": "Failed",
  "未执行": "Pending",
  "已处理（结果未知）": "Processed (result unknown)",
  "已跳过": "Skipped",
  "未选择导入目标": "No import target selected",
  "页面上没有任何可见菜单": "No visible menus on the page",
  "未找到歌单「": "Cannot find the menu item for playlist “",
  "」的菜单项，且找不到「添加到新歌单」入口": "”; “添加到新歌单” (Create playlist) is also unavailable",
  "新建歌单弹窗未出现": "The create-playlist dialog did not appear",
  "新建歌单弹窗找不到「确定」按钮": "The create-playlist dialog has no “确定” (Confirm) button",
  "新建未找到歌单「": "Creating playlist “",
  "」的弹窗未关闭（无法确认创建或入库）": "”: the dialog stayed open (creation and membership are unconfirmed)",
  "找不到「更多」按钮（页面未就绪或非详情页）": "Cannot find “更多” (More); the song page may not be ready",
  "点「更多」后菜单未弹出〔诊断: ": "The “更多” (More) menu did not open [diagnostics: ",
  "连续 ": "Paused after ",
  " 项操作异常（可能登录失效），已暂停": " consecutive operation errors (sign-in may have expired)",
  "<h3>📁 QQ 音乐歌单导入（DOM 版）</h3>": "<h3>📁 QQ Music Playlist Importer</h3>",
  "<p class=\"hint\">选择分类 CSV 后确认歌单映射。": "<p class=\"hint\">Select a classified CSV and confirm playlist mapping. ",
  "导入过程会逐首打开歌曲详情页并自动点击「更多→添加到→目标歌单」，": "The script opens each song and uses More → Add to → Playlist. ",
  "只在单标签页、同一账号运行；暂停不撤销正在处理的动作。</p>": "Use one tab and the same account. Pausing cannot undo an action already in progress.</p>",
  "<h3>❌ CSV 为空</h3>": "<h3>❌ The CSV is empty</h3>",
  "<h3>确认日志重导目标</h3>": "<h3>Confirm log retry targets</h3>",
  "<p class=\"hint\">仅重导失败或未执行的目标；不重新展开主分类与说唱歌单。操作成功、未知及已跳过行不会重导。</p>": "<p class=\"hint\">Retry only failed or pending targets. Main-category and rap targets are not expanded again. Completed, unknown and skipped rows are excluded.</p>",
  "<p class=\"hint\">待处理 ": "<p class=\"hint\">To process: ",
  " 项 · 跳过 ": " targets · Skipped: ",
  " 行。目标沿用日志，请核对名称和当前账号；结果仍需人工确认。</p>": " rows. Targets come from the log. Check playlist names and the current account; verify the results manually.</p>",
  "<div class=\"row\"><button id=\"qqimp-start\">🚀 开始导入</button></div>": "<div class=\"row\"><button id=\"qqimp-start\">🚀 Start import</button></div>",
  " 首</span>": " songs</span>",
  "<span style=\"white-space:nowrap\">歌单名前缀</span>": "<span style=\"white-space:nowrap\">Playlist prefix</span>",
  "<input type=\"text\" id=\"qqimp-prefix\" placeholder=\"可选，如：英语_\">": "<input type=\"text\" id=\"qqimp-prefix\" placeholder=\"Optional, e.g. English_\">",
  "</div><div class=\"hint\">默认歌单名 = 前缀 + 分类名，可逐行手改。": "</div><div class=\"hint\">Default playlist name = prefix + category; edit any row. ",
  "复用已有歌单时名称须完全一致且唯一；找不到目标菜单项时会尝试新建，创建和入库结果需人工核对。</div></div>": "To reuse a playlist, use its exact, unique name. If no target menu item is found, creation is attempted. Verify creation and membership manually.</div></div>",
  "<span style=\"white-space:nowrap\">说唱交叉 · ": "<span style=\"white-space:nowrap\">Additional rap playlist · ",
  " 首额外加入</span>": " extra songs</span>",
  "<h3>确认分类 → 歌单映射</h3>": "<h3>Confirm category → playlist mapping</h3>",
  "<p class=\"hint\">跳过 ": "<p class=\"hint\">Skipped: ",
  " 行（下架/无版权/缺ID/缺分类）。</p>": " rows (unavailable, missing ID/category).</p>",
  "没有可导入的歌曲或可重导的目标": "No songs or retry targets to import",
  "▶ 继续": "▶ Resume",
  "⏸ 暂停": "⏸ Pause",
  "<h3>⏸ 任务暂停中（": "<h3>⏸ Task paused (",
  " 操作成功 · ✗ ": " completed · ✗ ",
  " 失败</p>": " failed</p>",
  "<button id=\"qqimp-go\">▶ 继续导入</button>": "<button id=\"qqimp-go\">▶ Resume import</button>",
  "<button id=\"qqimp-report\" class=\"gray\">查看报告</button>": "<button id=\"qqimp-report\" class=\"gray\">View report</button>",
  "<button id=\"qqimp-abort\" class=\"gray\">放弃任务</button></div>": "<button id=\"qqimp-abort\" class=\"gray\">Abandon task</button></div>",
  "放弃当前导入任务？（已加入歌单的歌曲不会被移除）": "Abandon this task? Songs already added will remain; an in-flight action cannot be undone.",
  "<h3 style=\"color:#ff7875\">✗ 失败 ": "<h3 style=\"color:#ff7875\">✗ Failed: ",
  " 项</h3>": " targets</h3>",
  "📋 进度报告（尚未完成）": "📋 Progress report (not finished)",
  "🏁 操作结束": "🏁 Operations finished",
  "<p class=\"hint\">操作成功 ": "<p class=\"hint\">Completed operations: ",
  " · 失败 ": " · Failed: ",
  " · 未执行 ": " · Pending: ",
  " · 结果未知 ": " · Unknown: ",
  " · 按 MID + 歌单名统计，需人工核验入库</p>": " · Counted by MID + playlist name. Verify actual membership manually.</p>",
  "<p class=\"hint\">旧断点没有原始 CSV，日志只能导出已保存字段，无法还原额外列。</p>": "<p class=\"hint\">This old checkpoint has no original CSV. Export includes only saved fields; extra columns cannot be recovered.</p>",
  "<button id=\"qqimp-export\">⬇ 导出日志</button>": "<button id=\"qqimp-export\">⬇ Export log</button>",
  "<button id=\"qqimp-close\" class=\"gray\">关闭</button></div>": "<button id=\"qqimp-close\" class=\"gray\">Close</button></div>",
  "歌单导入面板": "Playlist importer panel",
  "<p class=\"hint\">日志重导须保留全部追加列，只会重新处理失败或未执行的目标。</p>": "<p class=\"hint\">Keep all appended columns when retrying a log. Only failed or pending targets will be selected.</p>",
  "）</h3>": ")</h3>"
};
function tr(text) { return UI_LANG === 'en' ? (UI_EN[text] || text) : text; }

function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // 去 BOM
  const rows = []; let row = []; let field = ''; let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } // "" 转义
        else inQuotes = false;
      } else field += c; // 引号内逗号/换行都是字面量
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* CRLF：\r 丢弃 */ }
    else field += c;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function csvToObjects(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(r => !(r.length === 1 && r[0] === '')) // 忽略空行
    .map(r => {
      const obj = {};
      header.forEach((h, i) => { obj[h] = (r[i] || '').trim(); });
      return obj;
    });
}

const LOG_FORMAT = 'qq-playlist-importer-log-v1';
const LOG_FIELDS = ['status', 'reason', 'target', 'meta'];

// 保存原始列/值，导入映射仅在单独的对象上 trim，日志不重写用户数据。
function readImportCsv(text) {
  const table = parseCsv(text);
  if (!table.length) return { headers: [], rows: [], objects: [], retryMode: false };
  const headers = table[0];
  const rows = table.slice(1).filter(row => !(row.length === 1 && row[0] === ''));
  if (rows.some(row => row.length !== headers.length)) throw new Error(tr('CSV 每行列数必须与表头一致'));
  if (!headers.some(h => h.trim() === 'QQ歌曲ID') || !headers.some(h => h.trim() === '建议主类别')) {
    throw new Error(tr('CSV 缺少必需表头：QQ歌曲ID、建议主类别'));
  }
  let originalColumns = headers.length;
  let records = null;
  const match = (headers[headers.length - 1] || '').match(/^__qqimp_(\d+)_meta$/);
  if (match && headers.length >= LOG_FIELDS.length) {
    const prefix = '__qqimp_' + match[1] + '_';
    const offset = headers.length - LOG_FIELDS.length;
    const blockMatches = LOG_FIELDS.every((field, i) => headers[offset + i] === prefix + field);
    if (blockMatches) {
      const metadata = rows.map(row => { try { return JSON.parse(row[headers.length - 1]); } catch (_) { return null; } });
      // 原始 CSV 中碰巧同名的列不是本工具日志；混合/损坏的真实日志则停止。
      const marked = metadata.some(meta => meta && meta.format === LOG_FORMAT);
      const logLabels = ['操作成功', '失败', '未执行', '已处理（结果未知）', '已跳过',
        'Operation completed', 'Failed', 'Pending', 'Processed (result unknown)', 'Skipped'];
      if (!marked && rows.some(row => logLabels.includes(row[offset]))) {
        throw new Error(tr('日志识别字段损坏或歌曲ID/目标已改变，请使用完整原日志'));
      }
      if (marked) {
        const midColumn = headers.slice(0, offset).findIndex(h => h.trim() === 'QQ歌曲ID');
        const allowed = ['succeeded', 'failed', 'pending', 'unknown', 'skipped'];
        if (!metadata.every((meta, i) => meta && meta.format === LOG_FORMAT && meta.columns === offset &&
            allowed.includes(meta.state) && meta.mid === (rows[i][midColumn] || '').trim() &&
            meta.target === rows[i][offset + 2] &&
            (!['failed', 'pending'].includes(meta.state) || meta.target.trim()))) {
          throw new Error(tr('日志识别字段损坏或歌曲ID/目标已改变，请使用完整原日志'));
        }
        originalColumns = offset;
        records = metadata.map((meta, i) => ({ state: meta.state, target: meta.target, reason: rows[i][offset + 1] }));
      }
    }
  }
  const sourceHeaders = headers.slice(0, originalColumns);
  const sourceRows = rows.map(row => row.slice(0, originalColumns));
  const objects = sourceRows.map((row, index) => {
    const object = {};
    sourceHeaders.forEach((header, i) => { object[header.trim()] = row[i].trim(); });
    Object.defineProperty(object, '__sourceRow', { value: index });
    if (records) Object.defineProperty(object, '__logRecord', { value: records[index] });
    return object;
  });
  return { headers: sourceHeaders, rows: sourceRows, objects, retryMode: !!records, records };
}

function groupByCategory(objects) {
  const groups = new Map();
  const skipped = [];
  for (const o of objects) {
    const mid = (o['QQ歌曲ID'] || '').trim();
    const status = (o['歌曲状态'] || '').trim();
    const cat = (o['建议主类别'] || '').trim();
    const logRecord = o.__logRecord;
    if (logRecord && !['failed', 'pending'].includes(logRecord.state)) {
      skipped.push({ row: o, reason: tr('日志项不是失败或未执行，已跳过') }); continue;
    }
    if (!mid) { skipped.push({ row: o, reason: tr('缺少QQ歌曲ID') }); continue; }
    if (status.indexOf('下架') !== -1 || status.indexOf('无版权') !== -1) {
      skipped.push({ row: o, reason: tr('歌曲状态:') + status }); continue; }
    if (!cat) { skipped.push({ row: o, reason: tr('缺少建议主类别') }); continue; }
    if (!groups.has(cat)) groups.set(cat, []);
    const song = {
      mid, title: o['歌曲标题'] || '', singer: o['歌手'] || '', seq: o['序号'] || '',
      rap: (o['说唱标签'] || '').trim() === '是',
    };
    if (Number.isInteger(o.__sourceRow)) song.sourceRow = o.__sourceRow;
    if (logRecord) song.retryTarget = logRecord.target;
    groups.get(cat).push(song);
  }
  return { groups, skipped };
}

function buildImportSongs(groups, map, rapOn, rapPlaylist, retryMode) {
  const songs = [];
  if (!retryMode && rapOn && !rapPlaylist.trim()) throw new Error(tr('额外说唱歌单名不能为空'));
  for (const [cat, entries] of groups) {
    for (const s of entries) {
      if (retryMode) {
        if (s.retryTarget) songs.push({ ...s, cat, playlist: s.retryTarget });
      } else if (map[cat]) {
        songs.push({ ...s, cat, playlist: map[cat] });
        if (rapOn && s.rap) songs.push({ ...s, cat, playlist: rapPlaylist });
      }
    }
  }
  return songs;
}

function operationState(t, s) {
  const key = s.mid + '@' + s.playlist;
  if (Object.prototype.hasOwnProperty.call(t.failLog, key)) return 'failed';
  if (t.okMids.includes(key)) return 'succeeded';
  return t.doneMids.includes(key) ? 'unknown' : 'pending';
}
const STATE_TEXT = { succeeded: tr('操作成功'), failed: tr('失败'), pending: tr('未执行'), unknown: tr('已处理（结果未知）'), skipped: tr('已跳过') };

function serializeCsv(rows) {
  return '\ufeff' + rows.map(row => row.map(value => '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"').join(',')).join('\r\n');
}

function buildTaskLog(t) {
  const source = t.csvSource;
  const headers = source ? source.headers : ['序号', '歌曲标题', '歌手', '建议主类别', 'QQ歌曲ID', '说唱标签'];
  let number = 1;
  while (LOG_FIELDS.some(field => headers.some(h => h.trim() === '__qqimp_' + number + '_' + field))) number++;
  const prefix = '__qqimp_' + number + '_';
  const result = [headers.concat(LOG_FIELDS.map(field => prefix + field))];
  function append(raw, s, record) {
    const state = s ? operationState(t, s) : record.state;
    const target = s ? s.playlist : record.target;
    const midIndex = headers.findIndex(h => h.trim() === 'QQ歌曲ID');
    const mid = (raw[midIndex] || '').trim();
    const reason = s ? (t.failLog[s.mid + '@' + s.playlist] || '') : record.reason;
    result.push(raw.concat([tr(STATE_TEXT[state]), reason, target,
      JSON.stringify({ format: LOG_FORMAT, columns: headers.length, mid, target, state })]));
  }
  if (source) {
    source.rows.forEach((raw, index) => {
      const songs = t.songs.filter(s => s.sourceRow === index);
      if (songs.length) songs.forEach(s => append(raw, s));
      else append(raw, null, (source.records && source.records[index]) || {
        state: 'skipped', target: '', reason: (t.skippedRows || {})[index] || tr('未选择导入目标') });
    });
  } else {
    // 旧断点已丢失原始 CSV；只导出它实际保存的字段，并保留目标级重导标记。
    t.songs.forEach(s => append([s.seq || '', s.title || '', s.singer || '', s.cat || '', s.mid, s.rap ? '是' : '否'], s));
  }
  return serializeCsv(result);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function hashString(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// QQ 音乐歌单名不允许 / \ : * ? " < | 等字符，默认名自动替换为 -
function sanitizePlaylistName(name) {
  return name.replace(/[/\\:*?"<>|]/g, '-');
}

// 歌单名默认 = 前缀 + 分类名（前缀在面板上填，如「英语_」；开源通用，不写死映射）

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseCsv, csvToObjects, groupByCategory, esc, hashString, sanitizePlaylistName,
    readImportCsv, buildImportSongs, operationState, buildTaskLog, serializeCsv, tr,
  };
}
// === PURE:END ===

// ==================== 任务存储（断点） ====================
// task = { csvHash, status: 'running'|'paused'|'done',
//          songs: [{mid,title,singer,cat,seq,playlist}],
//          doneMids: [],        // 已处理（成功或失败都算，不再重试）
//          okMids: [], failLog: {mid: reason},
//          playlistNames: [..] }
const TASK_KEY = 'qqimportdom:task';
const newTaskId = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
let runnerActive = false;

function loadTask() {
  try { return JSON.parse(localStorage.getItem(TASK_KEY) || 'null'); }
  catch (e) { return null; }
}
function saveTask(t) { localStorage.setItem(TASK_KEY, JSON.stringify(t)); }
function clearTask() { localStorage.removeItem(TASK_KEY); }

// ==================== 通用工具 ====================

const sleep = ms => new Promise(r => setTimeout(r, ms));

// 轮询直到 fn() 返回真值（元素）或超时，返回 fn 结果或 null
function waitFor(fn, timeout) {
  return new Promise(resolve => {
    const t0 = Date.now();
    const tick = () => {
      try {
        const v = fn();
        if (v) return resolve(v);
      } catch (e) { /* 忽略轮询内的临时异常 */ }
      if (Date.now() - t0 > timeout) return resolve(null);
      setTimeout(tick, 150);
    };
    tick();
  });
}

// ==================== 详情页三步点击 ====================

// 真实事件序列模拟（部分 Vue 组件监听 mousedown/hover，仅 click() 不触发）
// 注意：不能带 view: window —— Tampermonkey 沙箱的 window 是代理对象，MouseEvent 构造器会拒收
function hover(el) {
  el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
  el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
}
function realClick(el) {
  ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(type => {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
  });
}

// 失败诊断：页面上当前可见的疑似菜单（帮助定位「更多」点击后实际弹了什么）
function diagMenus() {
  const cands = [...document.querySelectorAll(
    '[class*=menu], [class*=popup], [class*=modal], [class*=dropdown], [class*=popover]')]
    .filter(el => el.offsetParent !== null);
  return cands.slice(0, 4).map(el =>
    String(el.className).slice(0, 50) + '→' + (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)
  ).join(' | ') || tr('页面上没有任何可见菜单');
}

// 第 1 步：详情页「更多」按钮（a.mod_btn，btn__txt 文本为「更多」）
function findMoreBtn() {
  return [...document.querySelectorAll('a.mod_btn')].find(a => {
    const t = a.querySelector('.btn__txt');
    return t && t.textContent.trim() === '更多';
  }) || null;
}

// 第 2 步：菜单里的「添加到」（带展开箭头 icon_arrow；注意「添加到新歌单」也有
// icon_add 但没有箭头，不能只按 icon_add 匹配）
function findAddLink() {
  const links = [...document.querySelectorAll('a.operate_menu__link')];
  return links.find(a => a.querySelector('.operate_menu__icon_arrow')) ||
         links.find(a => (a.textContent || '').trim() === '添加到') ||
         null;
}

// 「添加到新歌单」入口（目标歌单不存在时的回退路径）
function findNewPlaylistLink() {
  return [...document.querySelectorAll('a.operate_menu__link')].find(a =>
    (a.textContent || '').trim() === '添加到新歌单') || null;
}

// 第 3 步：歌单列表项（li.operate_menu__item > a[title=歌单名]）
function findPlaylistItem(name) {
  return [...document.querySelectorAll(
    '.operate_menu__item > a.operate_menu__link')].find(a =>
    a.getAttribute('title') === name) || null;
}

// 回退：目标歌单不存在 → 「添加到新歌单」弹窗自动建歌单并加入
async function addViaNewPlaylist(playlist) {
  const link = await waitFor(findNewPlaylistLink, 3000);
  if (!link) throw new Error(tr('未找到歌单「') + playlist + tr('」的菜单项，且找不到「添加到新歌单」入口'));
  realClick(link);
  const input = await waitFor(() =>
    document.querySelector('input#new_playlist, input.form_txt__input'), 4000);
  if (!input) throw new Error(tr('新建歌单弹窗未出现'));
  input.value = playlist;
  input.dispatchEvent(new Event('input', { bubbles: true }));  // 触发 Vue v-model
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await sleep(300);
  const btn = await waitFor(() =>
    [...document.querySelectorAll('button.mod_btn_green, button.upload_btns__item')].find(b =>
      (b.textContent || '').trim() === '确定') || null, 3000);
  if (!btn) throw new Error(tr('新建歌单弹窗找不到「确定」按钮'));
  realClick(btn);
  // 这里只观察弹窗是否关闭，不能证明服务端已创建歌单或加入歌曲。
  const closed = await waitFor(() => {
    const el = document.querySelector('input#new_playlist, input.form_txt__input');
    return (!el || el.offsetParent === null) ? true : null;
  }, 3500);
  if (!closed) {
    const closeBtn = document.querySelector('.yqq-dialog-close'); // 收场：关掉弹窗
    if (closeBtn) realClick(closeBtn);
    document.dispatchEvent(new KeyboardEvent('keydown',
      { key: 'Escape', keyCode: 27, bubbles: true }));
    throw new Error(tr('新建未找到歌单「') + playlist + tr('」的弹窗未关闭（无法确认创建或入库）'));
  }
  await sleep(800); // 等添加提交
  return true;
}

// 完整添加一首歌（当前详情页的歌 → playlist 歌单）
async function addCurrentSong(playlist) {
  // 1. 更多：hover + 点击序列双触发
  const more = await waitFor(findMoreBtn, 15000);
  if (!more) throw new Error(tr('找不到「更多」按钮（页面未就绪或非详情页）'));
  hover(more);
  await sleep(250);
  let add = findAddLink() || await waitFor(findAddLink, 1500);
  if (!add) { // hover 没弹出 → 真实点击序列
    realClick(more);
    add = await waitFor(findAddLink, 4000);
  }
  if (!add) throw new Error(tr('点「更多」后菜单未弹出〔诊断: ') + diagMenus() + '〕');

  // 2. 添加到（hover 展开侧拉歌单列表，click 兜底）
  hover(add);
  await sleep(200);
  realClick(add);

  // 3. 目标歌单（不存在则回退：自动新建歌单并加入）
  let item = await waitFor(() => findPlaylistItem(playlist), 3000);
  if (!item) { // 二次尝试
    hover(add); realClick(add);
    item = await waitFor(() => findPlaylistItem(playlist), 3000);
  }
  if (item) {
    realClick(item);
  } else {
    await addViaNewPlaylist(playlist); // 歌单不存在 → 建之
  }

  // 4. 等提交
  await sleep(600);
  return true;
}

// ==================== runner（SPA 路由循环 + 整页接力兜底） ====================

function songDetailUrl(mid) { return '/n/ryqq_v2/songDetail/' + mid; }

function currentMid() {
  const m = location.pathname.match(/songDetail\/([0-9A-Za-z]+)/);
  return m ? m[1] : null;
}

// SPA 内导航：点临时 <a> 让 vue-router 接管（页面不刷新，脚本不重注入）
// 返回 true = SPA 成功（继续当前循环）；false = 触发了整页导航（新页面 boot 接力）
async function spaNavigate(path) {
  if (location.pathname === path) return true;
  const a = document.createElement('a');
  a.href = path;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  const ok = await waitFor(() => location.pathname === path ? true : null, 2500);
  if (ok) { await sleep(300); return true; }
  location.href = path; // vue-router 未拦截 → 整页导航兜底
  return false;
}

// 断点键：mid@歌单（同一首交叉收录进两个歌单时分别记账）
const songKey = s => s.mid + '@' + s.playlist;

function pickNext(t) {
  return t.songs.find(s => t.doneMids.indexOf(songKey(s)) === -1) || null;
}

async function importLoop() {
  if (runnerActive) return;
  let initial = loadTask();
  if (!initial || initial.status !== 'running' || initial.paused) return;
  // 为旧版本断点补身份；异步动作后只合并到同一个仍存在的任务。
  if (!initial.taskId) { initial.taskId = newTaskId(); saveTask(initial); }
  const taskId = initial.taskId;
  runnerActive = true;
  try {
    for (;;) {
      let t = loadTask();
      if (!t || t.taskId !== taskId) return;
      if (!t || t.status !== 'running' || t.paused) { if (t) showResumeBar(); return; }
      const next = pickNext(t);
      if (!next) { t.status = 'done'; saveTask(t); finishReport(); return; }

      // 就位：跳到这首歌的详情页（SPA 优先）
      const want = songDetailUrl(next.mid);
      if (location.pathname !== want) {
        const spa = await spaNavigate(want);
        if (!spa) return; // 整页导航进行中，新页面 boot 会接管循环
      }

      t = loadTask(); // 重新读（可能刚被暂停）
      if (!t || t.taskId !== taskId) return;
      if (!t || t.status !== 'running' || t.paused) { if (t) showResumeBar(); return; }
      updateBar(t);

      let failure = null;
      try {
        await addCurrentSong(next.playlist);
      } catch (e) {
        failure = e && e.message ? e.message : String(e);
      }
      t = loadTask();
      if (!t || t.taskId !== taskId || t.status !== 'running') return;
      const key = songKey(next);
      if (!t.doneMids.includes(key)) t.doneMids.push(key);
      if (failure === null) {
        if (!t.okMids.includes(key)) t.okMids.push(key);
        delete t.failLog[key];
        t.consecFail = 0;
      } else {
        t.failLog[key] = failure;
        t.consecFail = (t.consecFail || 0) + 1;
      }
      saveTask(t);
      updateBar(t);

      // 连续 3 首失败：可能登录失效，暂停等人工介入
      if (t.consecFail >= 3) {
        t.paused = true;
        t.pauseReason = tr('连续 ') + t.consecFail + tr(' 项操作异常（可能登录失效），已暂停');
        saveTask(t);
        showResumeBar();
        return;
      }

      await sleep(500 + Math.random() * 600); // 轻微随机间隔
    }
  } finally {
    runnerActive = false;
  }
}

// ==================== UI（shadow DOM 隔离样式） ====================

const UI_CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: -apple-system, "PingFang SC", sans-serif; }
  .ball {
    position: fixed; right: 20px; bottom: 20px; z-index: 2147483647;
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg, #31c27c, #1e9e62);
    color: #fff; font-size: 22px; display: flex; align-items: center;
    justify-content: center; cursor: pointer;
    box-shadow: 0 4px 14px rgba(0,0,0,.3); user-select: none;
  }
  .ball:hover { transform: scale(1.08); }
  .barbox {
    position: fixed; right: 20px; bottom: 84px; z-index: 2147483647;
    width: 420px; max-height: 70vh; overflow-y: auto;
    background: #1c1c22; color: #e8e8ea; border-radius: 12px;
    padding: 14px; box-shadow: 0 8px 30px rgba(0,0,0,.5); font-size: 13px;
  }
  .strip {
    position: fixed; right: 20px; bottom: 20px; z-index: 2147483647;
    background: #1c1c22; color: #e8e8ea; border-radius: 22px;
    padding: 8px 16px; box-shadow: 0 4px 14px rgba(0,0,0,.4);
    font-size: 12px; display: flex; gap: 10px; align-items: center;
  }
  .strip button { padding: 4px 10px; font-size: 12px; }
  h3 { margin: 0 0 10px; font-size: 15px; color: #31c27c; }
  .row { display: flex; gap: 8px; margin: 6px 0; align-items: center; }
  .row input[type=text] {
    flex: 1; background: #2a2a32; border: 1px solid #3a3a44; color: #e8e8ea;
    border-radius: 6px; padding: 6px 8px; font-size: 13px; min-width: 0;
  }
  .badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
  .badge.todo { background: #3a3a44; color: #aaa; }
  .badge.ok { background: rgba(49,194,124,.2); color: #31c27c; }
  .badge.err { background: rgba(255,77,79,.2); color: #ff4d4f; }
  button {
    background: #31c27c; color: #fff; border: 0; border-radius: 6px;
    padding: 8px 14px; font-size: 13px; cursor: pointer;
  }
  button.gray { background: #3a3a44; }
  .bar { height: 8px; background: #2a2a32; border-radius: 4px; overflow: hidden; margin: 8px 0; }
  .bar > div { height: 100%; background: #31c27c; width: 0; transition: width .3s; }
  .cat-line { margin: 8px 0; padding: 8px; background: #232329; border-radius: 8px; }
  .hint { color: #888; font-size: 12px; line-height: 1.6; word-break: break-all; }
  .failist { color: #ff7875; font-size: 12px; line-height: 1.8; max-height: 200px; overflow-y: auto; }
`;

const ui = { root: null, box: null, strip: null };

function mountHost() {
  if (ui.root) return;
  const host = document.createElement('div');
  host.id = 'qq-importer-host';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = UI_CSS;
  shadow.appendChild(style);
  ui.root = shadow;
}

function mkEl(cls, html) {
  const d = document.createElement('div');
  d.className = cls;
  d.innerHTML = html;
  return d;
}

// ---------- 主面板（无任务时） ----------

function mountMainPanel() {
  mountHost();
  ui.box && ui.box.remove();
  ui.strip && ui.strip.remove();
  ui.box = mkEl('barbox',
    tr('<h3>📁 QQ 音乐歌单导入（DOM 版）</h3>') +
    '<div class="row"><input type="file" id="qqimp-file" accept=".csv,text/csv"></div>' +
    tr('<p class="hint">选择分类 CSV 后确认歌单映射。') +
    tr('导入过程会逐首打开歌曲详情页并自动点击「更多→添加到→目标歌单」，') +
    tr('只在单标签页、同一账号运行；暂停不撤销正在处理的动作。</p>'));
  ui.root.appendChild(ui.box);
  ui.box.querySelector('#qqimp-file').addEventListener('change', onFilePicked);
}

async function onFilePicked(e) {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  let csvSource;
  try { csvSource = readImportCsv(text); }
  catch (error) { ui.box.innerHTML = '<h3>❌ ' + esc(error.message) + '</h3>'; return; }
  const objects = csvSource.objects;
  if (!objects.length) { ui.box.innerHTML = tr('<h3>❌ CSV 为空</h3>'); return; }
  const { groups, skipped } = groupByCategory(objects);

  if (csvSource.retryMode) {
    const songs = buildImportSongs(groups, {}, false, '', true);
    const targets = [...new Set(songs.map(s => s.playlist))];
    ui.box.innerHTML = tr('<h3>确认日志重导目标</h3>') +
      tr('<p class="hint">仅重导失败或未执行的目标；不重新展开主分类与说唱歌单。操作成功、未知及已跳过行不会重导。</p>') +
      '<div class="failist">' + targets.map(esc).join('<br>') + '</div>' +
      tr('<p class="hint">待处理 ') + songs.length + tr(' 项 · 跳过 ') + skipped.length + tr(' 行。目标沿用日志，请核对名称和当前账号；结果仍需人工确认。</p>') +
      tr('<div class="row"><button id="qqimp-start">🚀 开始导入</button></div>');
    ui.box.querySelector('#qqimp-start').addEventListener('click', () => startNewTask(songs, csvSource, text, skipped));
    return;
  }

  let rows = '';
  let i = 0;
  const catList = [...groups.entries()].map(([cat, songs]) => ({ cat, songs, i: i++ }));
  const rapCount = catList.reduce((n, c) => n + c.songs.filter(s => s.rap).length, 0);
  for (const c of catList) {
    rows += '<div class="cat-line">' +
      '<span class="badge todo">' + esc(c.cat) + ' · ' + c.songs.length + tr(' 首</span>') +
      '<div class="row" style="margin-top:6px">' +
      '<input type="text" data-i="' + c.i + '" data-dirty="0" class="plname" value="' + esc(sanitizePlaylistName(c.cat)) + '">' +
      '</div></div>';
  }
  const prefixRow =
    '<div class="cat-line"><div class="row">' +
    tr('<span style="white-space:nowrap">歌单名前缀</span>') +
    tr('<input type="text" id="qqimp-prefix" placeholder="可选，如：英语_">') +
    tr('</div><div class="hint">默认歌单名 = 前缀 + 分类名，可逐行手改。') +
    tr('复用已有歌单时名称须完全一致且唯一；找不到目标菜单项时会尝试新建，创建和入库结果需人工核对。</div></div>');
  const rapRow = rapCount ?
    '<div class="cat-line"><label style="display:flex;gap:8px;align-items:center">' +
    '<input type="checkbox" id="qqimp-rap" checked>' +
    tr('<span style="white-space:nowrap">说唱交叉 · ') + rapCount + tr(' 首额外加入</span>') +
    '<input type="text" id="qqimp-rapname" data-dirty="0" value="说唱" style="flex:1"></label></div>' : '';
  ui.box.innerHTML = tr('<h3>确认分类 → 歌单映射</h3>') + prefixRow + rows + rapRow +
    tr('<p class="hint">跳过 ') + skipped.length + tr(' 行（下架/无版权/缺ID/缺分类）。</p>') +
    tr('<div class="row"><button id="qqimp-start">🚀 开始导入</button></div>');

  // 前缀实时联动：未手动改过的行跟随 前缀+分类名
  const prefixEl = ui.box.querySelector('#qqimp-prefix');
  prefixEl.addEventListener('input', () => {
    const p = prefixEl.value.trim();
    ui.box.querySelectorAll('.plname').forEach(inp => {
      if (inp.dataset.dirty === '0') {
        inp.value = sanitizePlaylistName(p + catList[+inp.dataset.i].cat);
      }
    });
    const rn = ui.box.querySelector('#qqimp-rapname');
    if (rn && rn.dataset.dirty === '0') rn.value = sanitizePlaylistName(p + '说唱');
  });
  ui.box.querySelectorAll('.plname, #qqimp-rapname').forEach(inp => {
    inp.addEventListener('input', () => { inp.dataset.dirty = '1'; });
  });

  ui.box.querySelector('#qqimp-start').addEventListener('click', () => {
    const map = {};
    ui.box.querySelectorAll('.plname').forEach(inp => {
      map[catList[+inp.dataset.i].cat] = inp.value.trim();
    });
    const rapOn = rapCount && ui.box.querySelector('#qqimp-rap').checked;
    const rapPl = rapOn ? ui.box.querySelector('#qqimp-rapname').value.trim() : '';
    let songs;
    try { songs = buildImportSongs(groups, map, rapOn, rapPl, false); }
    catch (error) { alert(error.message); return; }
    startNewTask(songs, csvSource, text, skipped);
  });
}

function startNewTask(songs, csvSource, text, skipped) {
  if (!songs.length) { alert(tr('没有可导入的歌曲或可重导的目标')); return; }
  const t = {
    taskId: newTaskId(), csvHash: hashString(text.slice(0, 65536) + text.length),
    status: 'running', paused: false, songs, doneMids: [], okMids: [], failLog: {}, consecFail: 0,
    csvSource: { headers: csvSource.headers, rows: csvSource.rows, records: csvSource.records },
    skippedRows: Object.fromEntries(skipped.map(entry => [entry.row.__sourceRow, entry.reason])),
    startedAt: Date.now(),
  };
  saveTask(t);
  location.href = songDetailUrl(songs[0].mid);
}

// ---------- 运行中：右上进度条 ----------

function mountStrip() {
  mountHost();
  ui.strip = mkEl('strip', '');
  ui.root.appendChild(ui.strip);
  return ui.strip;
}

function updateBar(t) {
  if (!ui.strip) mountStrip();
  const stats = taskReport(t);
  const done = stats.total - stats.pending, total = stats.total;
  const fails = stats.failed;
  ui.strip.innerHTML =
    '<span>📂 ' + done + '/' + total + '</span>' +
    '<span>✓ ' + stats.ok + '</span>' +
    '<span>✗ ' + fails + '</span>' +
    '<button id="qqimp-pause">' + (t.paused ? tr('▶ 继续') : tr('⏸ 暂停')) + '</button>';
  ui.strip.querySelector('#qqimp-pause').addEventListener('click', () => {
    const tt = loadTask();
    if (!tt || tt.taskId !== t.taskId || tt.status !== 'running') return;
    tt.paused = !tt.paused;
    saveTask(tt);
    if (tt.paused) {
      ui.strip.querySelector('#qqimp-pause').textContent = tr('▶ 继续');
    } else {
      importLoop(); // 从当前页面恢复循环
    }
  });
}

// ---------- 暂停/中断后：恢复条 ----------

function showResumeBar() {
  const t = loadTask();
  if (!t) return;
  mountHost();
  ui.box && ui.box.remove();
  ui.strip && ui.strip.remove();
  ui.strip = null;
  const stats = taskReport(t);
  const done = stats.total - stats.pending, total = stats.total;
  const fails = stats.failed;
  const reason = t.pauseReason ? '<p class="hint">⚠ ' + esc(t.pauseReason) + '</p>' : '';
  ui.box = mkEl('barbox',
    tr('<h3>⏸ 任务暂停中（') + done + '/' + total + tr('）</h3>') + reason +
    '<div class="bar"><div style="width:' + Math.floor(done / total * 100) + '%"></div></div>' +
    '<p class="hint">✓ ' + stats.ok + tr(' 操作成功 · ✗ ') + fails + tr(' 失败</p>') +
    '<div class="row">' +
    tr('<button id="qqimp-go">▶ 继续导入</button>') +
    tr('<button id="qqimp-report" class="gray">查看报告</button>') +
    tr('<button id="qqimp-abort" class="gray">放弃任务</button></div>'));
  ui.root.appendChild(ui.box);
  ui.box.querySelector('#qqimp-go').addEventListener('click', () => {
    const current = loadTask();
    if (!current || current.taskId !== t.taskId || current.status !== 'running') return;
    current.paused = false; current.pauseReason = '';
    saveTask(current);
    ui.box.remove(); ui.box = null;
    mountStrip();
    updateBar(current);
    importLoop();
  });
  ui.box.querySelector('#qqimp-report').addEventListener('click', finishReport);
  ui.box.querySelector('#qqimp-abort').addEventListener('click', () => {
    if (confirm(tr('放弃当前导入任务？（已加入歌单的歌曲不会被移除）'))) {
      const current = loadTask();
      if (!current || current.taskId !== t.taskId) return;
      clearTask();
      mountMainPanel();
    }
  });
}

// ---------- 完成报告 ----------

function taskReport(t) {
  const rows = t.songs.map(s => {
    const key = songKey(s);
    const state = operationState(t, s);
    return { song: s, state, result: tr(STATE_TEXT[state]), reason: state === 'failed' ? t.failLog[key] : '' };
  });
  const unique = [...new Map(rows.map(row => [songKey(row.song), row])).values()];
  return { rows, total: unique.length,
    ok: unique.filter(r => r.state === 'succeeded').length,
    failed: unique.filter(r => r.state === 'failed').length,
    pending: unique.filter(r => r.state === 'pending').length,
    unknown: unique.filter(r => r.state === 'unknown').length };
}

function finishReport() {
  const t = loadTask();
  if (!t) return;
  const stats = taskReport(t);
  mountHost();
  ui.strip && ui.strip.remove();
  ui.strip = null;
  ui.box && ui.box.remove();
  const total = stats.total, ok = stats.ok;
  const failSongs = [...new Map(stats.rows.filter(r => r.state === 'failed')
    .map(r => [songKey(r.song), r.song])).values()];
  let failHtml = '';
  if (failSongs.length) {
    failHtml = tr('<h3 style="color:#ff7875">✗ 失败 ') + failSongs.length + tr(' 项</h3>') +
      '<div class="failist">' + failSongs.map(s =>
        esc(s.seq + '.' + s.title + ' → ' + s.playlist + '：' + t.failLog[songKey(s)])).join('<br>') +
      '</div>';
  }
  ui.box = mkEl('barbox',
    '<h3>' + (stats.pending ? tr('📋 进度报告（尚未完成）') : tr('🏁 操作结束')) + '</h3>' +
    '<div class="bar"><div style="width:' + (total ? Math.floor((total - stats.pending) / total * 100) : 0) + '%"></div></div>' +
    tr('<p class="hint">操作成功 ') + ok + ' / ' + total +
    tr(' · 失败 ') + stats.failed + tr(' · 未执行 ') + stats.pending +
    tr(' · 结果未知 ') + stats.unknown + tr(' · 按 MID + 歌单名统计，需人工核验入库</p>') +
    (t.csvSource ? '' : tr('<p class="hint">旧断点没有原始 CSV，日志只能导出已保存字段，无法还原额外列。</p>')) + failHtml +
    tr('<p class="hint">日志重导须保留全部追加列，只会重新处理失败或未执行的目标。</p>') +
    '<div class="row">' +
    tr('<button id="qqimp-export">⬇ 导出日志</button>') +
    tr('<button id="qqimp-close" class="gray">关闭</button></div>'));
  ui.root.appendChild(ui.box);
  ui.box.querySelector('#qqimp-export').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buildTaskLog(t)], { type: 'text/csv;charset=utf-8' }));
    a.download = 'qq-import-log-' + Date.now() + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  ui.box.querySelector('#qqimp-close').addEventListener('click', () => {
    // 关闭报告也是只读操作，保留断点和恢复入口。
    const current = loadTask();
    if (current && current.status !== 'done') showResumeBar();
    else mountMainPanel();
  });
}

// ==================== 启动：判定页面角色 ====================

function boot() {
  const t = loadTask();
  if (!t || t.status === 'done') { mountMainPanel(); return; }
  if (!t.taskId) { t.taskId = newTaskId(); saveTask(t); }
  if (t.status === 'running' && !t.paused) {
    mountStrip();
    updateBar(t);
    importLoop(); // 循环自行导航到正确的详情页（SPA 优先，整页兜底）
    return;
  }
  showResumeBar(); // 暂停中
}

boot();
GM_registerMenuCommand(tr('歌单导入面板'), () => {
  if (ui.box || ui.strip) return;
  boot();
});

})();
