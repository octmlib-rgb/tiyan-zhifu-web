(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const clean = (value, limit=300) => String(value ?? '').trim().slice(0,limit);
  const BOT_URL = 'https://www.coze.cn/s/ZqhC8B4v-sM/';
  const RECORD_KEY = 'tiyan-workbench-records-v1';
  const REPORT_KEY = 'tiyan-workbench-reports-v1';
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const records = read(RECORD_KEY, {classes:[],students:[],team:[],tests:[]});
  let reports = read(REPORT_KEY, []);
  let currentVideoUrl = '';
  const themes = {
    lesson:'court',unit:'court',ppt:'warm',sport:'field',video:'field',review:'ink',research:'ink',drawing:'field',
    score:'data',fitness:'data',growth:'data',exam:'data',training:'field',competition:'field',team:'field',
    class:'ink',roster:'ink',tasks:'warm',schedule:'court',export:'ink',resources:'ink',all:'field'
  };
  const snippets = {
    lesson:'请按我提供的学校教案格式生成一份简洁的初中体育课时教案，含运动能力、健康行为、体育品德目标，教学流程、练习密度、负荷、安全与评价。',
    unit:'请依据2022版体育与健康课程标准和我提供的教材资料，设计初中体育大单元教学计划，并标注资料来源与假设。',
    ppt:'请把教案转成适合体育课堂展示的8页课件。每页只保留标题、1个视觉主元素、最多3个要点和教师备注；加入动作图解、练赛环节与评价，不要堆字。',
    sport:'请分析这个运动技术动作的准备、发力、完成阶段，给出常见错误、观察依据和分层纠正练习。',
    video:'请仅依据我上传的视频或关键帧分析可见动作，列出观察证据、可能问题、纠正练习与无法判断的部分。',
    review:'请根据我给出的听课事实，按目标、教学行为、学生参与、运动负荷、安全、改进建议形成简洁课堂评价，不要虚构事实。',
    research:'请根据我提供的实际教学材料写教研文稿，明确事实与推断，引用给出可核对的来源。',
    score:'请分析我上传的体育成绩 Excel：先核对表头、有效样本和缺测，再做描述统计与分层建议；正式评分前请核实地区、年份、性别与官方标准。',
    exam:'请核对我指定地区和年份的体育中考官方评分标准，给出来源链接、发布日期、适用年级和项目；未核实时不要计算正式分数。',
    training:'请根据学生现有成绩、目标、训练周期与器材条件生成安全的分层训练计划，包含复测和调整规则。'
  };
  const statusUpgrades = {
    lesson:['可使用 Agent','本地教案框架 + Agent'],unit:['可使用 Agent','本地单元框架 + Agent'],ppt:['可使用 Agent','本地课件脚本 + Agent'],
    sport:['可使用 Agent','本地技术卡 + Agent'],video:['待验证视频链路','本地视频观察可用'],review:['可使用 Agent','本地评课草稿 + Agent'],
    research:['可使用 Agent','本地教研提纲 + Agent'],drawing:['待接入专用绘图','本地场地图可用'],
    class:['页面待接入数据','本地班级登记可用'],roster:['页面待接入数据','本地名册登记可用'],
    fitness:['页面待接入数据','本地测试记录可用'],growth:['页面待接入数据','本地成长记录可用'],
    team:['页面待接入数据','本地训练队登记可用'],competition:['页面待接入工作流','本地单循环编排可用'],
    schedule:['页面待接入数据','本地课表编辑可用'],export:['待接入文件工作流','本地导出可用']
  };
  const upgradedConfig=window.tyWorkbench?.getConfig();let statusChanged=false;
  if(upgradedConfig){
    for(const [id,[oldText,newText]] of Object.entries(statusUpgrades)){
      if(upgradedConfig.modules?.[id]?.[3]===oldText){upgradedConfig.modules[id][3]=newText;statusChanged=true;}
    }
    if(upgradedConfig.copy?.sidebarFoot==='V1.0 界面初版 · 真实数据尚未接入'){upgradedConfig.copy.sidebarFoot='V1.1 本地功能版 · Coze 数据尚未同步';statusChanged=true;}
    if(upgradedConfig.copy?.footnote==='界面初版展示真实接入状态：空白统计不代表零人或零成绩。涉及学生信息时请按学校要求处理。'){upgradedConfig.copy.footnote='本地功能与 Coze Agent 分层运行：空白统计不代表零人或零成绩。涉及学生信息时请按学校要求处理。';statusChanged=true;}
    const copyUpgrades={scheduleNote:['目前无课表数据；时间格为界面框架，课表录入待接入。','目前无课表数据；点击课表管理录入课程，内容仅保存在本机浏览器。'],recentSubtitle:['基于课程与班级动态生成','从本机课表提取下几节课'],recentEmptyText:['导入课表后，最近的体育课会显示在这里。','在课表管理中录入课程后，会显示接下来的授课安排。']};
    for(const [id,[oldText,newText]] of Object.entries(copyUpgrades))if(upgradedConfig.copy?.[id]===oldText){upgradedConfig.copy[id]=newText;statusChanged=true;}
    const detailUpgrades={drawing:['可先向 Agent 描述场地和人数获取文字示意。','本地可生成足球、篮球和排球的场地与队员示意图。'],score:['已用合成成绩验证统计口径；在 Agent 对话中上传 Excel 使用。','本地进行描述统计；Excel 文件需在 Agent 对话中上传，正式评分应核对当年当地标准。'],competition:['目前尚无自动编排工作流。','本地可为 2—24 支队伍编排单循环赛程，结果由教师核对。'],export:['目前不展示未经验证的下载链接。','本地成果可重新打开，下载 Word 兼容稿或经打印另存 PDF。']};
    for(const [id,[oldText,newText]] of Object.entries(detailUpgrades))if(upgradedConfig.modules?.[id]?.[4]===oldText){upgradedConfig.modules[id][4]=newText;statusChanged=true;}
    const scoreSummaryOld='上传成绩 Excel 并识别分层与薄弱项目';
    if(upgradedConfig.modules?.score?.[1]===scoreSummaryOld){upgradedConfig.modules.score[1]='粘贴成绩或导入 CSV，查看缺测与均值';statusChanged=true;}
    if(statusChanged)window.tyWorkbench.saveConfig(upgradedConfig);
  }
  const actionLabel = id => ({lesson:'生成教案框架',unit:'生成大单元框架',ppt:'生成课件脚本',sport:'生成技术教学卡',review:'生成评课草稿',research:'生成教研提纲',training:'生成训练方案'})[id] || '生成草稿';
  const field = (label,id,placeholder='',type='text',wide=false) => `<label class="tool-field ${wide?'wide':''}"><span>${esc(label)}</span>${type==='textarea'?`<textarea id="${id}" placeholder="${esc(placeholder)}"></textarea>`:type==='select'?`<select id="${id}">${placeholder}</select>`:`<input id="${id}" type="${type}" placeholder="${esc(placeholder)}" ${type==='file'?`accept="${id==='videoFile'?'video/*':'.csv,.tsv,text/csv,text/tab-separated-values'}"`:''}/>`}</label>`;
  const agentButton = label => `<a class="btn primary" href="${BOT_URL}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
  function sectionFor(id) {
    if (id === 'all') return `<div class="tool-card"><h3>全部功能</h3><p class="tool-hint">选择一个模块进入独立工作区。已有本地工具可直接操作；需要 AI 或官方标准的任务会跳到公开的体研智辅对话。</p><div class="module-grid" style="padding:14px 0 0">${Object.keys(meta).filter(k=>k!=='all').map(k=>`<button class="module" data-module="${k}"><span class="module-icon">${esc(meta[k][2])}</span><span><strong>${esc(meta[k][0])}</strong><small>${esc(meta[k][3])}</small></span></button>`).join('')}</div></div>`;
    if (['lesson','unit','ppt','sport','review','research','training'].includes(id)) return generatorSection(id);
    if (id === 'score') return scoreSection();
    if (id === 'video') return videoSection();
    if (id === 'drawing') return drawingSection();
    if (id === 'competition') return competitionSection();
    if (id === 'schedule') return `<div class="tool-card"><h3>课表管理</h3><p class="tool-hint">当前课表保存在本机浏览器，页面顶部会同步显示。尚未与学校排课系统同步。</p><div class="detail-actions"><button class="btn primary" data-action="edit-schedule">编辑每周课表</button><button class="btn" data-module="home">查看首页课表</button></div><div id="moduleSchedule" class="tool-list"></div></div>`;
    if (id === 'tasks') return `<div class="tool-card"><h3>我的待办</h3><p class="tool-hint">可添加、完成和删除；只保存在当前浏览器。</p><div class="task-input" style="margin:16px 0"><input id="moduleTaskInput" placeholder="例如：周四复测七年级足球运球" maxlength="100"><button class="btn primary" data-action="add-task">添加</button></div><div id="moduleTaskList" class="tool-list"></div></div>`;
    if (['class','roster','team'].includes(id)) return recordsSection(id);
    if (['fitness','growth'].includes(id)) return testSection(id);
    if (id === 'exam') return `<div class="tool-card"><h3>地区标准核对</h3><div class="tool-grid">${field('地区','examRegion','例如：苏州市')}${field('考试年份','examYear','例如：2026','number')}${field('项目','examEvent','例如：1000米 / 800米')}${field('适用组别','examGroup','男生或女生')}</div><div class="tool-banner">评分表会按年份、地区与政策更新。当前工作台不内置未经核验的官方分值；你提供的图片可作为参考资料，但正式评分请以当年官方发布版本为准。</div><div class="detail-actions"><button class="btn" data-action="copy-exam">复制核对要求</button>${agentButton('打开 Agent 核对标准')}</div></div>`;
    if (id === 'export') return exportSection();
    if (id === 'resources') return resourcesSection();
    return `<div class="tool-card"><h3>模块准备区</h3><p>${esc(meta[id]?.[4] || '此模块正在完善。')}</p><div class="tool-banner">这个板块目前尚无独立数据服务。请先通过公开 Agent 完成专业内容生成，结果核对后再使用。</div>${agentButton('进入对应 Agent 能力')}</div>`;
  }
  function generatorSection(id) {
    const common = ['lesson','unit','ppt','sport','training'].includes(id);
    const inputs = common ? `<div class="tool-grid">${field('年级','toolGrade','例如：七年级')}${field('运动项目','toolSport','例如：足球')}${field(id==='unit'?'单元课时数':'课次 / 时长','toolSession',id==='unit'?'例如：18课时':'例如：第3课 · 45分钟')}${field('教学主题 / 动作','toolTopic','例如：脚内侧传球')}</div>` : `<div class="tool-grid">${field('课程 / 文稿主题','toolTopic','例如：八年级篮球运球')}${field('适用对象','toolGrade','例如：八年级1班')}</div>`;
    const specifics = id==='ppt' ? field('教案要点','toolNotes','粘贴目标、重难点、练习和评价要点','textarea',true) :
      id==='review' ? field('实际观察记录','toolNotes','填写课堂中实际看到的学生行为、教师组织、运动负荷和安全情况','textarea',true) :
      id==='research' ? field('实际材料与论点','toolNotes','写明真实课例、数据或研究问题；不要放入未核对的引用','textarea',true) :
      id==='training' ? field('现状与目标','toolNotes','例如：1000米当前4分50秒，8周后目标4分20秒；每周2练','textarea',true) :
      field('学情、器材和安全限制','toolNotes','填写已有资料；空缺内容会标为待补充','textarea',true);
    return `<div class="tool-card"><h3>${esc(meta[id][0])} · 快速工作区</h3><p class="tool-hint">本地生成可编辑的结构草稿，不消耗 Coze 额度。需要教材检索、事实判断或完整创作时再进入 Agent。</p>${inputs}<div class="tool-grid">${specifics}</div><div class="detail-actions"><button class="btn primary" data-action="generate" data-tool="${id}">${actionLabel(id)}</button><button class="btn" data-action="save-result">保存修改</button><button class="btn" data-action="copy-result">复制结果</button><button class="btn" data-action="download-doc">下载 Word 兼容稿</button><button class="btn" data-action="print-result">打印 / 另存 PDF</button></div><textarea id="moduleOutput" class="tool-output" placeholder="点击生成后，结果会显示在这里。可直接修改。"></textarea><p class="tool-hint">Word 兼容稿为可编辑 .doc 文件；PDF 通过浏览器打印保存。完整 PPTX 需另行接入文件生成能力。</p></div>`;
  }
  function scoreSection() {
    return `<div class="tool-card"><h3>成绩表快速体检</h3><p class="tool-hint">将 CSV / TSV 文件留在本机分析，不上传。可读取人数、缺测与数值列的平均值；不自动套用中考评分标准。</p><div class="tool-grid">${field('班级或数据集名称','scoreName','例如：九年级1班')}${field('选择 CSV / TSV','scoreFile','','file')}</div>${field('或粘贴表格内容','scorePaste','第一行放表头，后续每行一名学生；也支持直接粘贴 Excel 单元格','textarea',true)}<div class="detail-actions"><button class="btn primary" data-action="analyze-score">分析成绩</button><button class="btn" data-action="score-example">填入示例数据</button><button class="btn" data-action="save-result">保存报告修改</button><button class="btn" data-action="download-score">下载统计 CSV</button>${agentButton('上传 Excel 到 Agent')}</div><div id="scoreSummary" class="tool-banner">等待导入数据。正式评分需核对地区、年份、性别、项目及评分表来源。</div><div id="scoreChart" class="tool-chart"></div><textarea id="moduleOutput" class="tool-output" placeholder="分析报告会显示在这里，可编辑并复制。"></textarea></div>`;
  }
  function videoSection() {
    return `<div class="tool-card"><h3>动作观察工作区</h3><p class="tool-hint">本地视频仅在当前浏览器预览；这里提供人工观察记录。自动动作诊断需要将获授权的视频或关键帧交给具备视觉能力的 Agent。</p><div class="tool-grid">${field('动作名称','videoAction','例如：足球脚内侧传球')}${field('本地视频','videoFile','','file')}${field('可见的动作事实','videoFacts','例如：支撑脚落在球后方；触球后身体后仰','textarea',true)}</div><video id="videoPreview" controls style="display:none;width:100%;max-height:320px;border-radius:12px;background:#172923;margin-top:14px"></video><div class="tool-banner">观察顺序：准备姿态 → 发力 / 触球 → 随摆 / 落地。只记录画面能证实的事实，不凭单个视角断定伤病或身体状况。</div><div class="detail-actions"><button class="btn primary" data-action="video-checklist">生成观察卡</button><button class="btn" data-action="save-result">保存观察卡修改</button><button class="btn" data-action="copy-result">复制观察卡</button>${agentButton('打开 Agent 做视觉分析')}</div><textarea id="moduleOutput" class="tool-output" placeholder="动作观察卡将显示在这里，可编辑。"></textarea></div>`;
  }
  function drawingSection() {
    return `<div class="tool-card"><h3>体育场地示意图</h3><p class="tool-hint">生成可编辑参数的基础队形与场地 SVG；适用于教案插图，不替代专业战术板。</p><div class="tool-grid">${field('场地类型','drawingType','<option value="football">足球场</option><option value="basketball">篮球场</option><option value="volleyball">排球场</option>','select')}${field('队员人数','drawingCount','6','number')}</div><div class="detail-actions"><button class="btn primary" data-action="draw-court">更新示意图</button><button class="btn" data-action="download-svg">下载 SVG 图片</button></div><div id="drawingCanvas" class="tool-court"></div><p class="tool-hint">画面中的队员为示意点位，可在生成后下载 SVG 放入课件。</p></div>`;
  }
  function competitionSection() {
    return `<div class="tool-card"><h3>循环赛赛程编排</h3><p class="tool-hint">输入队伍名称，每行一个；单循环自动排出轮次。结果可编辑、复制或下载为 CSV。</p>${field('参赛队伍','competitionTeams','例如：七1班\n七2班\n七3班\n七4班','textarea',true)}<div class="detail-actions"><button class="btn primary" data-action="make-fixture">生成赛程</button><button class="btn" data-action="save-result">保存赛程修改</button><button class="btn" data-action="download-fixture">下载赛程 CSV</button></div><textarea id="moduleOutput" class="tool-output" placeholder="赛程将在这里显示，可直接修改。"></textarea></div>`;
  }
  function recordsSection(id) {
    const isClass=id==='class', isTeam=id==='team';
    const title=isClass?'班级':isTeam?'训练队':'学生';
    return `<div class="tool-card"><h3>${title}本地登记</h3><p class="tool-hint">此页记录仅保存在当前浏览器，不与 Coze、学校系统同步。请按学校规定处理学生资料。</p><div class="tool-grid">${field(`${title}名称`,'recordName',isClass?'例如：七年级1班':isTeam?'例如：校足球队':'例如：张同学')}${field(isClass?'学年 / 任课信息':isTeam?'项目 / 教练':'所属班级','recordNote',isClass?'2026—2027 学年':isTeam?'例如：足球':'例如：七年级1班')}</div><div class="detail-actions"><button class="btn primary" data-action="add-record" data-record="${id}">添加${title}</button><button class="btn" data-action="export-records" data-record="${id}">导出 CSV</button></div><div id="recordList" class="tool-list"></div></div>`;
  }
  function testSection(id) {
    return `<div class="tool-card"><h3>${id==='fitness'?'体质测试记录':'成长轨迹记录'}</h3><p class="tool-hint">仅在本机保存原始记录；暂不判定官方等级。成长页按时间展示同一学生的测试变化。</p><div class="tool-grid">${field('学生姓名 / 编号','testStudent','例如：七1班-01')}${field('测试项目','testEvent','例如：1000米')}${field('原始成绩与单位','testResult','例如：4分20秒')}${field('测试日期','testDate','','date')}</div><div class="detail-actions"><button class="btn primary" data-action="add-test">保存测试记录</button><button class="btn" data-action="export-tests">导出 CSV</button></div><div id="testList" class="tool-list"></div></div>`;
  }
  function exportSection() {
    return `<div class="tool-card"><h3>本地成果导出</h3><p class="tool-hint">本地生成的教案、课件脚本、评价稿和成绩统计在此集中下载。文件只保存在此浏览器；清理缓存前请导出。</p><div id="reportList" class="tool-list"></div><div id="reportViewer" hidden><h3 id="reportViewerTitle" style="margin-top:18px"></h3><textarea id="moduleOutput" class="tool-output" aria-label="成果内容"></textarea><div class="detail-actions"><button class="btn primary" data-action="save-result">保存当前修改</button><button class="btn" data-action="download-doc">下载 Word 兼容稿</button><button class="btn" data-action="print-result">打印 / 另存 PDF</button><button class="btn" data-action="copy-result">复制内容</button></div></div><div class="detail-actions"><button class="btn" data-action="backup-all">下载本机完整数据备份</button></div><div class="tool-banner">Word：下载兼容 .doc；Excel：下载 CSV 后用 Excel 打开；PDF：浏览器“打印 / 另存 PDF”。完整备份可能包含学生姓名与成绩，请按学校要求妥善保管。</div></div>`;
  }
  function resourcesSection() {
    const docs=['2022 体育与健康课程标准','华师版足球专项资源库','初一足球大单元教学计划','初一学期教学计划','苏州市体育中考评分表（用户提供图片）'];
    return `<div class="tool-card"><h3>资料索引</h3><p class="tool-hint">以下资料曾由项目用户提供。此网页只列索引，尚未核实每份资料在 Coze 知识库的实际导入和可检索状态。</p><div class="tool-list">${docs.map((name,i)=>`<div class="tool-row"><div><strong>${esc(name)}</strong><small>${i===4?'年份和正式效力需复核':'来源：用户提供文件'}</small></div><span class="status planned">待核对接入</span></div>`).join('')}</div><div class="tool-banner">后续如调用互联网资料，应标明网页来源、发布日期和检索日期；用户给定输出格式时优先按其格式呈现。</div></div>`;
  }
  function renderModulePage(id) {
    if (id==='home' || !meta[id]) return;
    const m=meta[id]; const detail=$('detail'); detail.dataset.theme=themes[id]||'field';
    detail.innerHTML=`<div class="detail-hero"><button class="link" data-module="home">← 返回工作台</button><div class="eyebrow" style="margin-top:19px;color:#d4f3df">体研智辅 / ${esc(m[0])}</div><h2>${esc(m[2])} ${esc(m[0])}</h2><p class="subtle">${esc(m[1])}</p><div class="detail-badges"><span>${esc(m[3])}</span><span>内容可自行编辑</span><span>本地工具优先 · 节省额度</span></div></div><div class="detail-body"><div>${sectionFor(id)}</div><aside class="detail-aside"><div class="detail-card"><h3>使用建议</h3><ol class="step-list"><li><b>1</b><span>先填写你已有的课程或原始数据。</span></li><li><b>2</b><span>用本地工具生成草稿并核对结果。</span></li><li><b>3</b><span>需要专业判断时再调用体研智辅 Agent。</span></li></ol><div class="detail-actions">${agentButton('打开公开 Agent')}</div></div><div class="detail-card"><h3>当前接入情况</h3><p>${esc(m[4])}</p><div class="tool-banner">暂无真实数据时保持空状态，不生成虚构的班级统计或学生结论。</div></div></aside></div>`;
    detail.classList.add('show');
    if(id==='tasks') renderModuleTasks();
    if(['class','roster','team'].includes(id)) renderRecords(id);
    if(['fitness','growth'].includes(id)) renderTests();
    if(id==='schedule') renderModuleSchedule();
    if(id==='export') renderReports();
    if(id==='drawing') drawCourt();
  }
  const baseShow=show;
  show=function(id){baseShow(id);renderModulePage(id);};
  renderModulePage(location.hash.slice(1));
  const value = (id,limit=1200) => clean($(id)?.value || '',limit);
  function keepReport(type,title,content) {
    if(!content) return;
    const id=Date.now()+Math.random();
    reports.unshift({id,type,title:clean(title,80),content:clean(content,30000),date:new Date().toLocaleString('zh-CN')});
    reports=reports.slice(0,60); save(REPORT_KEY,reports);
    return id;
  }
  function makeDraft(id) {
    const grade=value('toolGrade')||'待填写年级';
    const sport=value('toolSport')||'待填写项目';
    const session=value('toolSession')||'待填写课次';
    const topic=value('toolTopic')||'待填写主题';
    const notes=value('toolNotes')||'待补充学情与事实材料';
    if(id==='lesson') return `体育课时教案｜${grade} · ${sport} · ${topic}\n课次：${session}\n\n一、学情与依据\n已知资料：${notes}\n依据：2022版体育与健康课程标准的运动能力、健康行为、体育品德维度；具体教材页码待核对。\n\n二、教学目标\n运动能力：在真实练习和小场景中完成${topic}的关键动作。\n健康行为：能按提示热身、控制运动负荷并遵守安全规则。\n体育品德：在合作与比赛中遵守规则、积极参与。\n\n三、重点与难点\n重点：动作关键环节与练习节奏。\n难点：在变化情境中稳定运用。\n\n四、教学流程\n开始与准备（8分钟）：安全检查、动态热身、主题导入。\n基本部分（30分钟）：示范观察 → 分解练习 → 两人或小组合作 → 游戏 / 比赛迁移。\n结束部分（7分钟）：放松、同伴反馈、教师总结。\n\n五、负荷与安全\n依据班级实际体能调整练习密度；检查场地与器材，设置间距和停止信号。\n\n六、评价\n动作质量、参与合作、安全习惯三方面观察；记录具体证据，不用未经核验的分数。\n\n七、待补充\n班级人数、器材、学校教案表格和教材原文。`;
    if(id==='unit') return `体育大单元教学框架｜${grade} · ${sport}\n主题：${topic}\n计划课时：${session}\n已知资料：${notes}\n\n一、设计依据：依据2022版体育与健康课程标准的三维核心素养；具体教材章节待核对。\n二、单元目标：运动能力、健康行为、体育品德分项表述。\n三、阶段安排：基础技术 → 组合应用 → 比赛与评价。\n四、每阶段任务：学、练、赛、评相互衔接；为不同基础学生设置分层目标。\n五、过程评价：动作表现、参与合作、自主练习与安全行为。\n六、成果：课时教案、练习卡、比赛记录与反思。\n七、待核对：学校课时、教材原文、学生起点与场地器材。`;
    if(id==='ppt') {
      const pages=[['封面',`${grade} · ${sport} · ${topic}`],['今天学什么','1张动作照片 + 3项学习目标'],['动作全貌','连续动作图 / 关键帧；标出身体姿态'],['关键动作','最多3条动作提示，配局部放大图'],['分层练习','入门 / 提高 / 挑战三个任务卡'],['常见错误','错误动作与正确动作左右对照'],['学练赛结合','小场地比赛规则、分工与安全线'],['评价与课后练习','学生自评、同伴反馈、家庭练习']];
      return `体育课件脚本｜${grade} · ${sport} · ${topic}\n课次：${session}\n教案要点：${notes}\n\n${pages.map((p,i)=>`P${i+1} ${p[0]}\n画面：${p[1]}\n教师备注：用一句话引导学生观察或练习。`).join('\n\n')}\n\n版式规则：每页1个视觉主元素、最多3个要点；统一字体和运动配色，避免满页文字。\n素材来源、版权和动作准确性需人工核对。`;
    }
    if(id==='sport') return `运动技术教学卡｜${grade} · ${sport} · ${topic}\n课次：${session}\n学情：${notes}\n\n准备阶段：观察站位、视线与身体重心。\n发力阶段：观察主要关节运动与器械 / 球的接触。\n完成阶段：观察随摆、平衡与动作衔接。\n\n练习梯度：原地模仿 → 有目标练习 → 对抗或比赛应用。\n常见错误：请根据实际视频或课堂观察填写，不凭空诊断个体。\n评价证据：动作连贯性、目标完成率、规则和安全行为。`;
    if(id==='review') return `体育课堂评价草稿｜${topic}\n对象：${grade}\n实际观察：${notes}\n\n目标达成：根据教案目标与可见证据填写；目前不能仅凭上述记录推断全部学生达成情况。\n教学组织：记录教师示范、反馈、分组与过渡的具体事实。\n学生学习：记录参与、合作、练习密度和安全行为的具体证据。\n亮点：从观察事实中提取，避免笼统表扬。\n改进建议：一次聚焦1—2项可实施调整，下节课复查。\n结论：证据不足的指标标注“待观察”。`;
    if(id==='research') return `教研文稿提纲｜${topic}\n适用对象：${grade}\n现有材料：${notes}\n\n一、问题缘起：说明真实课堂中出现的问题及其影响。\n二、文献与政策依据：只使用可核对来源，记录作者、年份和链接。\n三、实施过程：交代学生、课时、教学措施和数据收集方法。\n四、结果：区分原始观察、统计结果和教师解释。\n五、讨论：说明适用范围、局限与下一轮改进。\n六、附录：教案、观察记录和匿名化数据。`;
    if(id==='training') return `分层训练方案｜${grade} · ${sport} · ${topic}\n周期 / 课次：${session}\n现状与目标：${notes}\n\n第1阶段｜建立动作与基线：测一次原始成绩，安排低负荷技术练习。\n第2阶段｜渐进负荷：每周按恢复情况逐步增加练习量，保留热身与放松。\n第3阶段｜情境应用：在接近考试或比赛的条件下练习，避免连续高强度日。\n复测与调整：每2周记录成绩、主观疲劳和缺课情况；达不到目标时先查技术、恢复和训练量。\n安全：有不适立即停止并交由校医或专业人员评估。\n\n具体组数和强度需根据年龄、身体情况及学校要求由教师确定。`;
    return '';
  }
  function putOutput(text,type,title) {
    const out=$('moduleOutput'); if(out){out.value=text;out.dataset.reportId=String(keepReport(type,title,text)||'');}
  }
  function saveResult() {
    const out=$('moduleOutput'),content=out?.value.trim();if(!content){notify('请先填写内容');return;}
    const existing=reports.find(r=>String(r.id)===out.dataset.reportId);
    if(existing){existing.content=clean(content,30000);existing.date=new Date().toLocaleString('zh-CN');save(REPORT_KEY,reports);}
    else out.dataset.reportId=String(keepReport(meta[location.hash.slice(1)]?.[0]||'工作台成果',$('reportViewerTitle')?.textContent||meta[location.hash.slice(1)]?.[0]||'未命名成果',content)||'');
    if(location.hash==='#export')renderReports();notify('修改已保存到本地成果');
  }
  function notify(message) {
    const t=$('toast'); if(!t)return; t.textContent=message;t.style.display='block';clearTimeout(window.tyToast);window.tyToast=setTimeout(()=>t.style.display='none',3000);
  }
  async function copyText(text) {
    if(!text){notify('请先生成内容');return;}
    try {await navigator.clipboard.writeText(text);notify('已复制到剪贴板');}
    catch {const out=$('moduleOutput'); if(out){out.focus();out.select();notify('已选中内容，请手动复制');}}
  }
  function download(name,body,mime) {
    const blob=new Blob([body],{type:mime});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
  }
  function printResult() {
    const body=$('moduleOutput')?.value.trim();if(!body){notify('请先生成内容');return;}
    $('printSheet')?.remove();const sheet=document.createElement('div');sheet.id='printSheet';
    const heading=document.createElement('h1');heading.textContent=$('reportViewerTitle')?.textContent||meta[location.hash.slice(1)]?.[0]||'体研智辅成果';
    const pre=document.createElement('pre');pre.textContent=body;sheet.append(heading,pre);document.body.append(sheet);
    window.addEventListener('afterprint',()=>sheet.remove(),{once:true});window.print();
  }
  function csvCell(value) {const s=String(value??'');return /[",\n\r]/.test(s)?`"${s.replaceAll('"','""')}"`:s;}
  function csv(rows) {return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');}
  function exportDoc() {
    const body=$('moduleOutput')?.value.trim();if(!body){notify('请先生成内容');return;}
    const title=$('reportViewerTitle')?.textContent||meta[location.hash.slice(1)]?.[0]||'体研智辅成果';
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:'Microsoft YaHei',sans-serif;margin:2.5cm;line-height:1.7}h1{font-size:20pt}pre{white-space:pre-wrap;font:11pt/1.7 'Microsoft YaHei',sans-serif}</style></head><body><h1>${esc(title)}</h1><pre>${esc(body)}</pre></body></html>`;
    download(`体研智辅_${title}.doc`,html,'application/msword;charset=utf-8');
  }
  function parseTable(raw) {
    const text=String(raw||'').replace(/^\uFEFF/,''); const delim=text.split(/\r?\n/,1)[0].includes('\t')?'\t':',';
    const rows=[];let row=[],part='',quoted=false;
    for(let i=0;i<text.length;i++) {const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){part+='"';i++;}else quoted=!quoted;}else if(ch===delim&&!quoted){row.push(part.trim());part='';}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(part.trim());if(row.some(Boolean))rows.push(row);row=[];part='';}else part+=ch;}
    row.push(part.trim());if(row.some(Boolean))rows.push(row);
    return rows;
  }
  function numberFrom(raw) {
    const s=String(raw||'').trim();if(!s||/缺测|未测|—|^[-xX]$/.test(s))return null;
    const time=s.match(/^(\d+)[:分]\s*(\d{1,2})(?:秒)?$/);if(time)return Number(time[1])*60+Number(time[2]);
    const n=Number(s.replace(/[,，]/g,''));return Number.isFinite(n)?n:null;
  }
  function analyzeScore(raw) {
    const rows=parseTable(raw); if(rows.length<2)throw Error('至少需要一行表头和一行成绩');
    const headers=rows[0].map((h,i)=>h||`第${i+1}列`); const data=rows.slice(1).filter(r=>r.some(Boolean));
    if(!data.length)throw Error('没有可分析的学生记录');
    const stats=headers.map((name,i)=>{const raw=data.map(r=>r[i]);const vals=raw.map(numberFrom).filter(v=>v!==null);const hasTime=raw.some(v=>/\d+[:分]\s*\d{1,2}/.test(String(v||'')));return {name:hasTime&&!/秒/.test(name)?`${name}（秒）`:name,vals,missing:data.length-vals.length};}).filter(x=>x.vals.length&&x.vals.length/data.length>=.35&&!/学号|编号|序号|^id$|姓名|班级|性别/i.test(x.name));
    const name=value('scoreName')||'未命名数据集';
    const lines=[`学情分析｜${name}`,`总记录：${data.length}；以下为原始数据描述统计，不是官方评分。`];
    if(!stats.length)lines.push('未识别到足够数值成绩列；请检查表头与单元格格式。');
    stats.forEach(s=>{const sum=s.vals.reduce((a,b)=>a+b,0);const avg=sum/s.vals.length;const range=s.vals.reduce((r,n)=>[Math.min(r[0],n),Math.max(r[1],n)],[Infinity,-Infinity]);lines.push(`${s.name}：有效 ${s.vals.length}，缺测 ${s.missing}，平均 ${avg.toFixed(2)}，最小 ${range[0]}，最大 ${range[1]}。`);});
    lines.push('解释前请区分越高越好和越低越好项目，并核对地区、年份、性别及项目标准。');
    $('scoreSummary').textContent=`${data.length} 条记录 · ${stats.length} 个可统计成绩列 · ${stats.reduce((n,s)=>n+s.missing,0)} 个列内缺测`;
    $('scoreChart').innerHTML='<p class="tool-hint">图条按各项目本列最大值缩放；不同项目单位不同，不能横向比较。</p>'+stats.map(s=>{const avg=s.vals.reduce((a,b)=>a+b,0)/s.vals.length;const ownMax=s.vals.reduce((m,n)=>Math.max(m,n),1);return `<div class="tool-bar"><span title="${esc(s.name)}">${esc(s.name)}</span><div class="tool-bar-track"><span style="width:${Math.max(3,Math.min(100,avg/ownMax*100))}%"></span></div><b>${avg.toFixed(1)}</b></div>`;}).join('');
    putOutput(lines.join('\n'),'成绩统计',name);
    window.tyScoreStats={name,dataCount:data.length,stats};
  }
  function drawCourt() {
    const type=$('drawingType')?.value||'football'; const count=Math.max(1,Math.min(20,Number($('drawingCount')?.value)||6));
    const court=type==='basketball'?`<rect x="36" y="28" width="568" height="304" rx="6"/><path d="M320 28v304"/><circle cx="320" cy="180" r="54"/><path d="M36 112h105v136H36m568-136H499v136h105"/><circle cx="96" cy="180" r="45"/><circle cx="544" cy="180" r="45"/>`:
      type==='volleyball'?`<rect x="36" y="28" width="568" height="304" rx="6"/><path d="M320 28v304M212 28v304M428 28v304"/>`:
      `<rect x="36" y="28" width="568" height="304" rx="6"/><path d="M320 28v304"/><circle cx="320" cy="180" r="53"/><path d="M36 91h102v178H36m568-178H502v178h102"/><path d="M36 128h45v104H36m568-104h-45v104h45"/>`;
    const dots=Array.from({length:count},(_,i)=>{const side=i%2, lane=Math.floor(i/2), lanes=Math.ceil(count/2);const x=side?425:215;const y=75+(lane+.5)*(215/lanes);return `<g><circle cx="${x}" cy="${y.toFixed(1)}" r="14" fill="${side?'#f2b463':'#276c86'}" stroke="white" stroke-width="3"/><text x="${x}" y="${(y+4).toFixed(1)}" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${i+1}</text></g>`;}).join('');
    $('drawingCanvas').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img" aria-label="${type}场地与${count}名队员示意图"><rect width="640" height="360" fill="${type==='football'?'#dcefe2':'#e8f1ed'}"/><g fill="none" stroke="#fff" stroke-width="3">${court}</g>${dots}</svg>`;
  }
  function makeFixture() {
    const names=value('competitionTeams').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    if(names.length<2||names.length>24){notify('请输入 2—24 支队伍，每行一个');return;}
    if(new Set(names).size!==names.length){notify('队伍名称不能重复');return;}
    const teams=[...names];if(teams.length%2)teams.push('轮空');const n=teams.length;const matches=[];
    for(let round=0;round<n-1;round++) {for(let i=0;i<n/2;i++){const a=teams[i],b=teams[n-1-i];if(a!=='轮空'&&b!=='轮空')matches.push([round+1,a,b]);}teams.splice(1,0,teams.pop());}
    const out=['单循环赛程｜'+names.length+'支队伍',...matches.map(([r,a,b])=>`第${r}轮：${a} vs ${b}`),'请补充比赛时间、场地和裁判；同分规则由赛事规程确定。'].join('\n');
    window.tyFixture=matches;putOutput(out,'赛事编排',`${names.length}队单循环赛`);
  }
  const recordMap={class:'classes',roster:'students',team:'team'};
  function renderRecords(id) {
    const key=recordMap[id], list=Array.isArray(records[key])?records[key]:[];
    $('recordList').innerHTML=list.length?list.map((item,i)=>`<div class="tool-row"><div><strong>${esc(item.name)}</strong><small>${esc(item.note)} · ${esc(item.date)}</small></div><button data-action="remove-record" data-record="${id}" data-index="${i}" aria-label="删除记录">删除</button></div>`).join(''):'<div class="tool-banner">暂无记录。填写上方内容后点击添加。</div>';
  }
  function renderTests() {
    const list=Array.isArray(records.tests)?records.tests:[];
    $('testList').innerHTML=list.length?[...list].sort((a,b)=>b.date.localeCompare(a.date)).map(item=>{const i=list.indexOf(item);return `<div class="tool-row"><div><strong>${esc(item.student)} · ${esc(item.event)}</strong><small>${esc(item.date)} ｜ ${esc(item.result)}</small></div><button data-action="remove-test" data-index="${i}" aria-label="删除记录">删除</button></div>`;}).join(''):'<div class="tool-banner">暂无体质测试记录。添加后可在成长页按日期查看。</div>';
  }
  function renderModuleTasks() {
    const list=window.tyWorkbench?.getTasks()||[];
    $('moduleTaskList').innerHTML=list.length?list.map((task,i)=>`<div class="tool-row"><label style="display:flex;align-items:center;gap:9px"><input type="checkbox" data-action="toggle-task" data-index="${i}" ${task.done?'checked':''}><span style="${task.done?'text-decoration:line-through;color:#9aa7a1':''}">${esc(task.text)}</span></label><button data-action="remove-task" data-index="${i}">删除</button></div>`).join(''):'<div class="tool-banner">待办已清空。添加备课、复测或训练任务。</div>';
  }
  function syncClassOverview() {
    const cfg=window.tyWorkbench?.getConfig();const count=(records.classes||[]).length;
    $('classValue').textContent=count?String(count):(cfg?.copy.classValue||'—');
    $('classMessage').textContent=count?'已在本机建立班级':(cfg?.copy.classMessage||'尚未建立班级与学生名册');
    $('classNote').textContent=count?'本地登记未与 Coze 或学校系统同步。':(cfg?.copy.classNote||'先添加班级，再接入成绩与成长记录。');
  }
  function renderModuleSchedule() {
    const cfg=window.tyWorkbench?.getConfig();if(!cfg)return;
    $('moduleSchedule').innerHTML=cfg.schedule.map((row,i)=>`<div class="tool-row"><strong>第 ${i+1} 节</strong><span>${row.filter(Boolean).length?esc(row.map((x,d)=>x?`${['一','二','三','四','五'][d]}：${x}`:'').filter(Boolean).join(' ｜ ')):'尚未安排'}</span></div>`).join('');
  }
  function renderReports() {
    $('reportList').innerHTML=reports.length?reports.map((r,i)=>`<div class="tool-row"><div><strong>${esc(r.title)}</strong><small>${esc(r.type)} · ${esc(r.date)}</small></div><div style="display:flex;gap:6px"><button data-action="open-report" data-index="${i}">打开</button><button data-action="remove-report" data-index="${i}">删除</button></div></div>`).join(''):'<div class="tool-banner">尚无本地成果。先到备课、课件、评价或学情分析页面生成。</div>';
  }
  function saveRecord(id) {
    const name=value('recordName'),note=value('recordNote');if(!name){notify('请填写名称');return;}
    const key=recordMap[id];records[key]??=[];records[key].unshift({name:clean(name,80),note:clean(note,100),date:new Date().toLocaleDateString('zh-CN')});save(RECORD_KEY,records);renderRecords(id);$('recordName').value='';$('recordNote').value='';notify('已保存在当前浏览器');
    if(id==='class')syncClassOverview();
  }
  function saveTest() {
    const student=value('testStudent'),event=value('testEvent'),result=value('testResult'),date=value('testDate');
    if(!student||!event||!result||!date){notify('请填写学生、项目、成绩与日期');return;}
    records.tests??=[];records.tests.unshift({student:clean(student,80),event:clean(event,80),result:clean(result,80),date});save(RECORD_KEY,records);renderTests();notify('体质记录已保存在本机');
  }
  document.addEventListener('change', async e=>{
    if(e.target?.id==='scoreFile'){
      const file=e.target.files?.[0];if(!file)return;
      if(!/\.(csv|tsv)$/i.test(file.name)){notify('本地分析支持 CSV / TSV；Excel 文件请上传至公开 Agent');return;}
      if(file.size>4_000_000){notify('文件超过 4 MB，请精简后再分析');return;}
      $('scorePaste').value=await file.text();notify('已读取表格，点击“分析成绩”');
    }
    if(e.target?.id==='videoFile'){
      const file=e.target.files?.[0];if(!file)return;
      if(currentVideoUrl)URL.revokeObjectURL(currentVideoUrl);
      currentVideoUrl=URL.createObjectURL(file);const player=$('videoPreview');player.src=currentVideoUrl;player.style.display='block';
    }
    if(e.target?.dataset.action==='toggle-task'){
      const list=window.tyWorkbench.getTasks();const i=Number(e.target.dataset.index);if(list[i]){list[i].done=e.target.checked;window.tyWorkbench.saveTasks(list);renderModuleTasks();}
    }
  });
  document.addEventListener('click', async e=>{
    const target=e.target.closest('[data-action]');if(!target)return;
    const action=target.dataset.action,id=location.hash.slice(1);
    if(action==='generate'){const text=makeDraft(target.dataset.tool);putOutput(text,meta[id]?.[0]||'教学成果',`${value('toolTopic')||meta[id]?.[0]||'未命名'} · ${meta[id]?.[0]||''}`);notify('草稿已生成，可直接修改');}
    else if(action==='save-result')saveResult();
    else if(action==='copy-result')await copyText($('moduleOutput')?.value||'');
    else if(action==='download-doc')exportDoc();
    else if(action==='backup-all'){const payload={format:'tiyan-workbench-backup-v1',exportedAt:new Date().toISOString(),config:read('tiyan-workbench-content-v2',null),tasks:read('tiyan-workbench-tasks-v1',[]),records:read(RECORD_KEY,{}),reports:read(REPORT_KEY,[])};download(`体研智辅_本机数据备份_${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(payload,null,2),'application/json;charset=utf-8');notify('备份已下载，请妥善保管');}
    else if(action==='print-result')printResult();
    else if(action==='score-example'){$('scorePaste').value='姓名,性别,1000米秒,跳绳个数\n示例甲,男,250,155\n示例乙,男,265,142\n示例丙,男,,168';$('scoreName').value='演示数据（虚构）';notify('已填入虚构示例，点击分析');}
    else if(action==='analyze-score'){try{analyzeScore(value('scorePaste',4_000_000));notify('描述统计已生成');}catch(err){notify(err.message);}}
    else if(action==='download-score'){const x=window.tyScoreStats;if(!x){notify('请先分析成绩');return;}download(`体研智辅_${x.name}_统计.csv`,csv([['项目','有效数','缺测数','平均值','最小值','最大值'],...x.stats.map(s=>{const range=s.vals.reduce((r,n)=>[Math.min(r[0],n),Math.max(r[1],n)],[Infinity,-Infinity]);return [s.name,s.vals.length,s.missing,(s.vals.reduce((a,b)=>a+b,0)/s.vals.length).toFixed(2),range[0],range[1]];})]),'text/csv;charset=utf-8');}
    else if(action==='video-checklist'){const text=`动作观察卡｜${value('videoAction')||'待填写动作'}\n可见事实：${value('videoFacts')||'待填写观察事实'}\n准备阶段：站位、视线、重心。\n发力阶段：关节协同、接触点、动作方向。\n完成阶段：随摆、平衡、下一动作衔接。\n可能问题与纠正：仅在可见证据支持时填写。\n无法判断：被遮挡动作、力量大小和身体健康状态。`;putOutput(text,'动作观察',value('videoAction')||'动作观察');notify('观察卡已生成');}
    else if(action==='draw-court')drawCourt();
    else if(action==='download-svg'){const svg=$('drawingCanvas')?.querySelector('svg');if(svg)download('体研智辅_场地示意图.svg',new XMLSerializer().serializeToString(svg),'image/svg+xml;charset=utf-8');}
    else if(action==='make-fixture')makeFixture();
    else if(action==='download-fixture'){if(!window.tyFixture){notify('请先生成赛程');return;}download('体研智辅_单循环赛程.csv',csv([['轮次','队伍A','队伍B'],...window.tyFixture]),'text/csv;charset=utf-8');}
    else if(action==='edit-schedule')window.tyWorkbench?.openEditorTab('schedule');
    else if(action==='add-task'){const input=$('moduleTaskInput');if(!input?.value.trim()){notify('先输入待办');return;}const list=window.tyWorkbench.getTasks();list.unshift({text:clean(input.value,100),done:false});window.tyWorkbench.saveTasks(list);input.value='';renderModuleTasks();}
    else if(action==='remove-task'){const list=window.tyWorkbench.getTasks();list.splice(Number(target.dataset.index),1);window.tyWorkbench.saveTasks(list);renderModuleTasks();}
    else if(action==='add-record')saveRecord(target.dataset.record);
    else if(action==='remove-record'){const key=recordMap[target.dataset.record];records[key].splice(Number(target.dataset.index),1);save(RECORD_KEY,records);renderRecords(target.dataset.record);if(target.dataset.record==='class')syncClassOverview();}
    else if(action==='export-records'){const key=recordMap[target.dataset.record],list=records[key]||[];download(`体研智辅_${meta[id]?.[0]||'记录'}.csv`,csv([['名称','说明','登记日期'],...list.map(x=>[x.name,x.note,x.date])]),'text/csv;charset=utf-8');}
    else if(action==='add-test')saveTest();
    else if(action==='remove-test'){records.tests.splice(Number(target.dataset.index),1);save(RECORD_KEY,records);renderTests();}
    else if(action==='export-tests')download('体研智辅_体质记录.csv',csv([['学生','项目','原始成绩','日期'],...(records.tests||[]).map(x=>[x.student,x.event,x.result,x.date])]),'text/csv;charset=utf-8');
    else if(action==='copy-exam')await copyText(`请核对${value('examRegion')||'指定地区'}${value('examYear')||'指定年份'}年${value('examGroup')||'指定组别'}的${value('examEvent')||'体育中考项目'}官方评分标准，附来源链接、发布日期与适用边界。`);
    else if(action==='open-report'){const r=reports[Number(target.dataset.index)];if(!r)return;$('reportViewer').hidden=false;$('reportViewerTitle').textContent=r.title;$('moduleOutput').value=r.content;$('moduleOutput').dataset.reportId=String(r.id);$('reportViewer').scrollIntoView({block:'nearest',behavior:'smooth'});}
    else if(action==='remove-report'){const removed=reports.splice(Number(target.dataset.index),1)[0];save(REPORT_KEY,reports);renderReports();if(String(removed?.id)===$('moduleOutput')?.dataset.reportId)$('reportViewer').hidden=true;}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target?.id==='moduleTaskInput'){e.preventDefault();document.querySelector('[data-action="add-task"]')?.click();}});
  syncClassOverview();
  window.addEventListener('beforeunload',()=>{if(currentVideoUrl)URL.revokeObjectURL(currentVideoUrl);});
})();
