(() => {
  'use strict';
  let openedVersion = '';
  let noticeShown = false;

  async function checkForUpdate() {
    try {
      const response = await fetch('./version.json', {cache:'no-store'});
      if (!response.ok) return;
      const {version} = await response.json();
      if (typeof version !== 'string' || !version) return;
      if (!openedVersion) { openedVersion = version; return; }
      if (version === openedVersion || noticeShown) return;
      noticeShown = true;
      const notice = document.createElement('div');
      notice.className = 'site-update-notice';
      notice.setAttribute('role','status');
      const message = document.createElement('span');
      message.textContent = '工作台有新版本，刷新后即可使用。请先保存正在编辑的内容。';
      const reload = document.createElement('button');
      reload.type = 'button';
      reload.textContent = '刷新更新';
      reload.addEventListener('click', () => location.reload());
      const dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.className = 'dismiss';
      dismiss.textContent = '稍后';
      dismiss.setAttribute('aria-label','稍后更新');
      dismiss.addEventListener('click', () => notice.remove());
      notice.append(message,reload,dismiss);
      document.body.append(notice);
    } catch { /* Offline or local-file viewing does not need update polling. */ }
  }

  checkForUpdate();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkForUpdate(); });
  window.setInterval(() => { if (!document.hidden) checkForUpdate(); }, 300000);
})();
