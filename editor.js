(() => {
  'use strict';
  const KEY = 'tiyan-workbench-content-v2';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const plain = (value, max = 300) => String(value ?? '').replace(/[<>\u0000-\u001f]/g, '').slice(0, max).trim();
  const validUrl = value => { try { const u = new URL(String(value)); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
  const copyLabels = [
    ['brandIcon','品牌图标'],['brandName','品牌名称'],['brandSubtitle','品牌副标题'],['sidebarFoot','侧栏底部说明'],
    ['semesterLabel','学年学期'],['avatarText','右上角头像字'],['heroEyebrow','首页英文标签'],['heroGreeting','欢迎语'],
    ['scheduleTitle','课表标题'],['scheduleSubtitle','课表说明'],['scheduleNote','课表提示'],
    ['tasksTitle','待办标题'],['tasksSubtitle','待办说明'],['recentTitle','近期教学标题'],['recentSubtitle','近期教学说明'],
    ['recentEmptyTitle','近期教学空状态标题'],['recentEmptyText','近期教学空状态说明'],
    ['featuredTitle','常用入口标题'],['featuredSubtitle','常用入口说明'],
    ['classTitle','班级概览标题'],['classSubtitle','班级概览说明'],['classValue','班级概览数值或符号'],
    ['classMessage','班级概览主信息'],['classNote','班级概览补充说明'],
    ['calendarHeading','日历标题'],['calendarSubtitle','日历说明'],
    ['statusTitle','右栏工作台标题'],['statusSubtitle','右栏工作台说明'],
    ['statusLabel1','状态项目 1'],['statusValue1','状态内容 1'],['statusLabel2','状态项目 2'],['statusValue2','状态内容 2'],
    ['statusLabel3','状态项目 3'],['statusValue3','状态内容 3'],['statusLabel4','状态项目 4'],['statusValue4','状态内容 4'],
    ['footnote','页脚提示']
  ];
  const defaultConfig = {
    copy: Object.fromEntries(copyLabels.map(([id]) => [id, $(id)?.textContent || ''])),
    todaySuffix: '选择一项教学任务开始工作',
    taskPlaceholder: $('taskText').placeholder,
    botLabel: $('botTopLink').textContent,
    botUrl: $('botTopLink').href,
    groupLabels: groups.map(g => g.label),
    nav: Object.fromEntries(groups.flatMap(g => g.items.map(([id, icon, name]) => [id, {icon, name}]))),
    modules: Object.fromEntries(Object.entries(meta).map(([id, fields]) => [id, [...fields]])),
    featured: [...featured],
    schedule: Array.from({length:8}, () => Array(5).fill('')),
    periodTimes: ['08:00','08:50','09:55','10:45','13:30','14:20','15:20','16:10'],
    calendarEvents: [],
    links: {}
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  function normalize(value) {
    const c = clone(defaultConfig);
    if (!value || typeof value !== 'object') return c;
    for (const [id] of copyLabels) if (typeof value.copy?.[id] === 'string') c.copy[id] = plain(value.copy[id], id === 'footnote' ? 500 : 250);
    for (const key of ['todaySuffix','taskPlaceholder','botLabel']) if (typeof value[key] === 'string') c[key] = plain(value[key], 160);
    c.botUrl = validUrl(value.botUrl) || c.botUrl;
    if (Array.isArray(value.groupLabels)) c.groupLabels = c.groupLabels.map((v, i) => typeof value.groupLabels[i] === 'string' ? plain(value.groupLabels[i], 32) : v);
    for (const id of Object.keys(c.nav)) {
      const n = value.nav?.[id];
      if (n && typeof n === 'object') {
        if (typeof n.icon === 'string') c.nav[id].icon = plain(n.icon, 12);
        if (typeof n.name === 'string') c.nav[id].name = plain(n.name, 40);
      }
    }
    for (const id of Object.keys(c.modules)) {
      const m = value.modules?.[id];
      if (Array.isArray(m)) c.modules[id] = c.modules[id].map((v, i) => typeof m[i] === 'string' ? plain(m[i], i === 4 ? 1200 : 230) : v);
      if (value.links?.[id]) c.links[id] = validUrl(value.links[id]) || '';
    }
    if (Array.isArray(value.featured)) {
      const ordered = [...new Set(value.featured.filter(id => Object.hasOwn(c.modules, id)))];
      c.featured = ordered.slice(0, 12);
    }
    if (Array.isArray(value.schedule)) c.schedule = c.schedule.map((row, r) => row.map((v, d) => plain(value.schedule?.[r]?.[d] ?? v, 50)));
    if (Array.isArray(value.periodTimes)) c.periodTimes = c.periodTimes.map((v, i) => plain(value.periodTimes[i] ?? v, 20));
    if (Array.isArray(value.calendarEvents)) c.calendarEvents = value.calendarEvents.slice(0, 100).map(x => ({date: /^\d{4}-\d{2}-\d{2}$/.test(x?.date || '') ? x.date : '', title: plain(x?.title, 80)})).filter(x => x.date && x.title);
    return c;
  }
  let config;
  try { config = normalize(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { config = clone(defaultConfig); }
  let draft = null;
  let draftTasks = [];
  let activeTab = 'copy';
  let selectedModule = 'lesson';
  const tabs = [['copy','首页文案'],['modules','导航与模块'],['schedule','课表'],['calendar','日历'],['tasks','待办'],['backup','备份']];
  function renderNavigation() {
    $('nav').innerHTML = groups.map((group, gi) => `<h3>${esc(config.groupLabels[gi])}</h3>${group.items.map(([id]) => `<button class="nav-btn" data-module="${id}"><span class="nav-ico">${esc(config.nav[id].icon)}</span><span>${esc(config.nav[id].name)}</span></button>`).join('')}`).join('');
  }
  function renderFeatured() {
    $('moduleGrid').innerHTML = config.featured.map(id => { const m = meta[id]; return `<button class="module" data-module="${id}"><span class="module-icon">${esc(m[2])}</span><span><strong>${esc(m[0])}</strong><small>${esc(m[1])}</small></span></button>`; }).join('');
  }
  function renderSchedule() {
    const weekdays = ['周一','周二','周三','周四','周五'];
    const today = new Date().getDay();
    $('scheduleGrid').innerHTML = '<div></div>' + weekdays.map((v, i) => `<div class="day ${today === i+1 ? 'today' : ''}">${v}</div>`).join('') + config.schedule.map((row, r) => `<div class="period"><strong>第 ${r+1} 节</strong><span>${esc(config.periodTimes[r])}</span></div>${row.map((v, d) => `<div class="slot ${today === d+1 ? 'today' : ''} ${v ? 'filled' : ''}" title="${esc(v || '未安排')}">${esc(v || '—')}</div>`).join('')}`).join('');
  }
  function renderRecent() {
    const container = $('recentItems');
    if (!container) return;
    const today = new Date();
    const weekdays = ['周日','周一','周二','周三','周四','周五','周六'];
    const upcoming = [];
    for (let offset=0; offset<8 && upcoming.length<3; offset++) {
      const date = new Date(today.getFullYear(),today.getMonth(),today.getDate()+offset);
      const day = date.getDay();
      if (day<1 || day>5) continue;
      for (let period=0; period<config.schedule.length && upcoming.length<3; period++) {
        const course = config.schedule[period][day-1];
        if (course) upcoming.push({label:offset===0?'今天':offset===1?'明天':weekdays[day],period:period+1,time:config.periodTimes[period],course});
      }
    }
    if (!upcoming.length) {
      container.className = 'empty';
      container.innerHTML = `<div><div class="symbol">◌</div><strong id="recentEmptyTitle">${esc(config.copy.recentEmptyTitle)}</strong><small id="recentEmptyText">${esc(config.copy.recentEmptyText)}</small></div>`;
      return;
    }
    container.className = 'recent-list';
    container.innerHTML = upcoming.map(x=>`<div class="recent-row"><span>${esc(x.label)} · 第 ${x.period} 节<small>${esc(x.time)}</small></span><strong>${esc(x.course)}</strong></div>`).join('');
  }
  function renderCalendar() {
    const now = new Date(); const y = now.getFullYear(); const m = now.getMonth();
    $('calendarTitle').textContent = `${y} 年 ${m+1} 月`;
    const first = new Date(y, m, 1).getDay(); const days = new Date(y, m+1, 0).getDate();
    let html = ['日','一','二','三','四','五','六'].map(x => `<span class="dow">${x}</span>`).join('') + '<span></span>'.repeat(first);
    for (let d=1; d<=days; d++) {
      const date = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const events = config.calendarEvents.filter(x => x.date === date);
      html += `<span class="${d===now.getDate()?'today':''} ${events.length?'event-day':''}" title="${esc(events.map(x=>x.title).join('；'))}">${d}</span>`;
    }
    $('calendarGrid').innerHTML = html;
  }
  function apply() {
    for (const [id] of copyLabels) if ($(id)) $(id).textContent = config.copy[id];
    $('taskText').placeholder = config.taskPlaceholder;
    $('botTopLink').textContent = config.botLabel;
    $('botTopLink').href = config.botUrl;
    document.title = `${config.copy.brandName} · ${config.copy.brandSubtitle}`;
    const now = new Date(); const weekdays = ['周日','周一','周二','周三','周四','周五','周六'];
    $('todayLine').textContent = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 · ${weekdays[now.getDay()]} · ${config.todaySuffix}`;
    groups.forEach((g, gi) => { g.label = config.groupLabels[gi]; g.items.forEach(item => { item[1] = config.nav[item[0]].icon; item[2] = config.nav[item[0]].name; }); });
    for (const id of Object.keys(meta)) meta[id].splice(0, meta[id].length, ...config.modules[id]);
    featured.splice(0, featured.length, ...config.featured);
    renderNavigation(); renderFeatured(); renderSchedule(); renderRecent(); renderCalendar();
    const current = location.hash.slice(1);
    if (current && (current === 'home' || Object.hasOwn(meta, current))) show(current);
    updateDetailLink();
  }
  function updateDetailLink() {
    const id = location.hash.slice(1);
    const link = $('detail').querySelector('a.btn');
    if (link) link.href = config.links[id] || config.botUrl;
  }
  function field(label, attr, value, type='text') {
    const tag = type === 'textarea' ? `<textarea ${attr}>${esc(value)}</textarea>` : `<input type="${type}" ${attr} value="${esc(value)}" />`;
    return `<div class="editor-row"><label>${esc(label)}</label>${tag}</div>`;
  }
  function renderEditor() {
    $('editorTabs').innerHTML = tabs.map(([id,label]) => `<button type="button" data-edit-tab="${id}" class="${activeTab===id?'active':''}">${label}</button>`).join('');
    const body = $('editorBody');
    if (activeTab === 'copy') {
      const sections = [
        ['品牌与欢迎语', ['brandIcon','brandName','brandSubtitle','sidebarFoot','semesterLabel','avatarText','heroEyebrow','heroGreeting']],
        ['课表、待办与近期教学', ['scheduleTitle','scheduleSubtitle','scheduleNote','tasksTitle','tasksSubtitle','recentTitle','recentSubtitle','recentEmptyTitle','recentEmptyText']],
        ['首页功能与班级概览', ['featuredTitle','featuredSubtitle','classTitle','classSubtitle','classValue','classMessage','classNote']],
        ['日历、右侧状态与页脚', ['calendarHeading','calendarSubtitle','statusTitle','statusSubtitle','statusLabel1','statusValue1','statusLabel2','statusValue2','statusLabel3','statusValue3','statusLabel4','statusValue4','footnote']]
      ];
      body.innerHTML = sections.map(([heading, ids]) => `<h3>${heading}</h3>${ids.map(id => field(copyLabels.find(x => x[0]===id)[1], `data-copy="${id}"`, draft.copy[id], ['scheduleNote','classNote','footnote','recentEmptyText'].includes(id)?'textarea':'text')).join('')}`).join('') + `<h3>提示与公开对话</h3>${field('日期后提示', 'data-setting="todaySuffix"', draft.todaySuffix)}${field('待办输入提示', 'data-setting="taskPlaceholder"', draft.taskPlaceholder)}${field('Agent 按钮文字', 'data-setting="botLabel"', draft.botLabel)}${field('Agent 公开链接', 'data-setting="botUrl"', draft.botUrl)}<div class="editor-message">修改后点击“保存修改”。页面文案和模块配置不会上传到 Coze，只存在此浏览器。</div>`;
    } else if (activeTab === 'modules') {
      const select = `<select id="moduleSelect" class="editor-input">${Object.keys(draft.modules).map(id => `<option value="${id}" ${id===selectedModule?'selected':''}>${esc(draft.nav[id].name)}</option>`).join('')}</select>`;
      const m = draft.modules[selectedModule], n = draft.nav[selectedModule];
      body.innerHTML = `<h3>导航分组</h3>${draft.groupLabels.map((v,i) => field(`分组 ${i+1}`, `data-group="${i}"`, v)).join('')}<h3>首页导航</h3>${field('首页图标', 'data-nav-icon="home"', draft.nav.home.icon)}${field('首页名称', 'data-nav-name="home"', draft.nav.home.name)}<h3>选择板块</h3><div class="editor-row"><label>板块</label>${select}</div>${field('侧栏图标', `data-nav-icon="${selectedModule}"`, n.icon)}${field('侧栏名称', `data-nav-name="${selectedModule}"`, n.name)}<h3>板块内容</h3>${field('页面标题', `data-module-field="0"`, m[0])}${field('一句话说明', `data-module-field="1"`, m[1])}${field('模块图标', `data-module-field="2"`, m[2])}${field('接入状态', `data-module-field="3"`, m[3])}${field('详细说明', `data-module-field="4"`, m[4], 'textarea')}${field('专用跳转链接', `data-link="${selectedModule}"`, draft.links[selectedModule] || '')}<div class="editor-row"><label>显示在首页常用入口</label><input type="checkbox" data-featured="${selectedModule}" ${draft.featured.includes(selectedModule)?'checked':''}></div><div class="editor-message">链接留空时使用上方的 Agent 公开链接。仅允许 HTTPS 链接。尚未接通的板块请保持明确的“待接入”状态。</div>`;
    } else if (activeTab === 'schedule') {
      body.innerHTML = `<h3>每周课表</h3><p>编辑课程名称，留空即显示“—”。数据只保存在当前浏览器。</p><div class="editor-grid-wrap"><div class="editor-grid">${['周一','周二','周三','周四','周五'].map(d=>`<div class="grid-label">${d}</div>`).join('')}${draft.schedule.map((row,r)=>row.map((v,d)=>`<input aria-label="第${r+1}节 ${['周一','周二','周三','周四','周五'][d]}" data-slot="${r},${d}" value="${esc(v)}" placeholder="第${r+1}节" maxlength="50">`).join('')).join('')}</div></div><h3>节次时间</h3>${draft.periodTimes.map((v,i)=>field(`第 ${i+1} 节`, `data-time="${i}"`, v)).join('')}`;
    } else if (activeTab === 'calendar') {
      body.innerHTML = `<h3>教学日历事件</h3><p>添加日期与事项。当前月份中，有事项的日期会显示标记；月份和今天日期由设备时间自动确定。</p><div id="editorEvents">${draft.calendarEvents.map((event,i)=>`<div class="editor-day"><input type="date" data-event-date="${i}" value="${esc(event.date)}"><input class="editor-input" data-event-title="${i}" value="${esc(event.title)}" placeholder="教学活动"><button type="button" data-event-remove="${i}" aria-label="删除日历事项">×</button></div>`).join('')}</div><div class="editor-actions"><button type="button" class="btn" id="addEvent">＋ 添加事项</button></div>`;
    } else if (activeTab === 'tasks') {
      body.innerHTML = `<h3>待办清单</h3><p>首页可以直接添加和勾选待办；此处可改文字、调整完成状态或删除。</p><div id="editorTasks">${draftTasks.map((task,i)=>`<div class="editor-task"><input type="checkbox" data-edit-task-done="${i}" ${task.done?'checked':''} aria-label="待办完成状态"><input type="text" class="editor-input" data-edit-task-text="${i}" value="${esc(task.text)}" maxlength="100"><button type="button" data-edit-task-remove="${i}" aria-label="删除待办">×</button></div>`).join('')}</div><div class="editor-actions"><button type="button" class="btn" id="addEditorTask">＋ 添加待办</button></div>`;
    } else {
      body.innerHTML = `<h3>备份与恢复</h3><p>生成 JSON 备份文本后可复制保存；也可直接下载文件。导入后先检查，再点击“保存修改”。</p><div class="editor-actions"><button type="button" class="btn" id="generateBackup">生成备份文本</button><button type="button" class="btn" id="exportConfig">下载 JSON 文件</button><label class="btn" for="importConfig" style="cursor:pointer">选择 JSON 文件</label><input id="importConfig" type="file" accept="application/json,.json" hidden></div><textarea id="backupJson" class="editor-input" rows="9" style="margin-top:12px;resize:vertical" placeholder="生成备份文本，或粘贴已有的 JSON 备份"></textarea><div class="editor-actions"><button type="button" class="btn" id="importBackupText">从上方文本导入</button></div><div class="editor-divider"></div><button type="button" class="btn" id="resetDraft">恢复初始内容（需保存）</button><div class="editor-message">这里的内容仅在此浏览器中保存。清理浏览器数据会移除本地修改；请先备份。备份若包含学生信息，请按学校规定保管。</div>`;
    }
  }
  function openEditor() { draft = clone(config); draftTasks = clone(tasks); activeTab='copy'; $('editorBackdrop').hidden=false; $('editorDrawer').hidden=false; document.body.style.overflow='hidden'; renderEditor(); $('closeEditor').focus(); }
  function closeEditor() { $('editorBackdrop').hidden=true; $('editorDrawer').hidden=true; document.body.style.overflow=''; draft=null; }
  $('editWorkbench').addEventListener('click', openEditor);
  $('closeEditor').addEventListener('click', closeEditor);
  $('cancelEditor').addEventListener('click', closeEditor);
  $('editorBackdrop').addEventListener('click', closeEditor);
  document.addEventListener('keydown', e => { if (e.key==='Escape' && !$('editorDrawer').hidden) closeEditor(); });
  $('editorTabs').addEventListener('click', e => { const tab=e.target.closest('[data-edit-tab]'); if (!tab) return; activeTab=tab.dataset.editTab; renderEditor(); });
  $('editorBody').addEventListener('input', e => {
    const x=e.target;
    if (x.dataset.copy) draft.copy[x.dataset.copy]=x.value;
    if (x.dataset.setting) draft[x.dataset.setting]=x.value;
    if (x.dataset.group !== undefined) draft.groupLabels[+x.dataset.group]=x.value;
    if (x.dataset.navIcon) draft.nav[x.dataset.navIcon].icon=x.value;
    if (x.dataset.navName) draft.nav[x.dataset.navName].name=x.value;
    if (x.dataset.moduleField !== undefined) draft.modules[selectedModule][+x.dataset.moduleField]=x.value;
    if (x.dataset.link) draft.links[x.dataset.link]=x.value;
    if (x.dataset.slot) { const [r,d]=x.dataset.slot.split(',').map(Number); draft.schedule[r][d]=x.value; }
    if (x.dataset.time !== undefined) draft.periodTimes[+x.dataset.time]=x.value;
    if (x.dataset.eventDate !== undefined) draft.calendarEvents[+x.dataset.eventDate].date=x.value;
    if (x.dataset.eventTitle !== undefined) draft.calendarEvents[+x.dataset.eventTitle].title=x.value;
    if (x.dataset.editTaskText !== undefined) draftTasks[+x.dataset.editTaskText].text=x.value;
  });
  function loadBackup(text) {
    try { const data=JSON.parse(text); draft=normalize(data.config||data); draftTasks=Array.isArray(data.tasks)?data.tasks.slice(0,300).map(t=>({text:plain(t.text,100),done:!!t.done})).filter(t=>t.text):[]; activeTab='copy'; renderEditor(); toast('备份已读入，请检查后保存'); }
    catch { toast('JSON 备份格式无效'); }
  }
  function backupText() { return JSON.stringify({version:2,exportedAt:new Date().toISOString(),config:normalize(draft),tasks:draftTasks},null,2); }
  $('editorBody').addEventListener('change', e => {
    const x=e.target;
    if (x.id==='moduleSelect') { selectedModule=x.value; renderEditor(); }
    if (x.dataset.featured) { const id=x.dataset.featured; draft.featured=draft.featured.filter(v=>v!==id); if(x.checked)draft.featured.push(id); }
    if (x.dataset.editTaskDone !== undefined) draftTasks[+x.dataset.editTaskDone].done=x.checked;
    if (x.id==='importConfig' && x.files?.[0]) {
      const file=x.files[0]; if(file.size>2_000_000){toast('备份文件过大');return;}
      file.text().then(loadBackup);
    }
  });
  $('editorBody').addEventListener('click', e => {
    const x=e.target;
    if (x.dataset.eventRemove !== undefined) { draft.calendarEvents.splice(+x.dataset.eventRemove,1); renderEditor(); }
    if (x.id==='addEvent') { const d=new Date(); const localDate=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; draft.calendarEvents.push({date:localDate,title:''}); renderEditor(); }
    if (x.dataset.editTaskRemove !== undefined) { draftTasks.splice(+x.dataset.editTaskRemove,1); renderEditor(); }
    if (x.id==='addEditorTask') { draftTasks.unshift({text:'新待办',done:false}); renderEditor(); }
    if (x.id==='resetDraft') { draft=clone(defaultConfig); draftTasks=[]; activeTab='copy'; renderEditor(); toast('已加载初始内容，保存后生效'); }
    if (x.id==='generateBackup') { $('backupJson').value=backupText(); $('backupJson').focus(); $('backupJson').select(); toast('备份文本已生成，可复制保存'); }
    if (x.id==='importBackupText') loadBackup($('backupJson').value);
    if (x.id==='exportConfig') { const blob=new Blob([backupText()],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`体研智辅_工作台备份_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
  });
  $('saveEditor').addEventListener('click', () => {
    const invalid=[draft.botUrl,...Object.values(draft.links).filter(Boolean)].find(url => !validUrl(url));
    if (invalid) { toast('跳转链接须为有效的 HTTPS 地址'); activeTab='copy'; renderEditor(); return; }
    config=normalize(draft);
    tasks=draftTasks.map(t=>({text:plain(t.text,100),done:!!t.done})).filter(t=>t.text);
    localStorage.setItem(KEY,JSON.stringify(config)); persist(); renderTasks(); apply(); closeEditor(); toast('修改已保存到当前浏览器');
  });
  document.addEventListener('click', e => { if (e.target.closest('[data-module]')) updateDetailLink(); });
  window.tyWorkbench = {
    getConfig: () => clone(config),
    saveConfig: value => { config = normalize(value); localStorage.setItem(KEY, JSON.stringify(config)); apply(); },
    openEditorTab: tab => { openEditor(); if (tabs.some(([id]) => id === tab)) { activeTab = tab; renderEditor(); } },
    getTasks: () => clone(tasks),
    saveTasks: value => { tasks = value.map(t => ({text:plain(t.text,100),done:!!t.done})).filter(t => t.text); persist(); renderTasks(); }
  };
  apply();
})();
