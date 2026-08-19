/* ─── accounts.js — Quản lý Tài khoản & Phê duyệt ─── */

async function loadAccountsSection() {
  await loadSharedData();
  const isAdmin = state.currentUser?.role === 'admin';
  const adminView = document.getElementById('accounts-admin-view');
  const userView = document.getElementById('accounts-user-view');

  if (isAdmin) {
    if(adminView) adminView.style.display = 'block';
    if(userView) userView.style.display = 'none';
    if(adminView) renderAdminView(adminView);
    loadAccounts();
    loadApprovalPanel();
  } else {
    if(adminView) adminView.style.display = 'none';
    if(userView) userView.style.display = 'block';
    if(userView) renderUserView(userView);
    loadUserProfile();
  }
}

function renderAdminView(container) {
  container.innerHTML = `
    <div class="page-heading">
      <div>
        <div class="page-heading__title">Quản lý Tài khoản (Admin)</div>
        <div class="page-heading__sub">Tạo, sửa, phân quyền và kiểm soát tài khoản người dùng</div>
      </div>
      <button class="btn btn-primary" id="btnAddAccount">Tạo tài khoản mới</button>
    </div>

    <div class="grid-4 mb-6">
      <div class="kpi-card"><div class="kpi-card__label">Tổng tài khoản</div><div class="kpi-card__value" id="accTotal">--</div></div>
      <div class="kpi-card"><div class="kpi-card__label">Quản trị viên</div><div class="kpi-card__value" style="-webkit-text-fill-color:var(--accent-2)" id="accAdmins">--</div></div>
      <div class="kpi-card"><div class="kpi-card__label">Người dùng</div><div class="kpi-card__value" style="-webkit-text-fill-color:var(--cyan)" id="accUsers">--</div></div>
      <div class="kpi-card"><div class="kpi-card__label">Banned</div><div class="kpi-card__value" style="-webkit-text-fill-color:var(--red)" id="accInactive">--</div></div>
    </div>

    <div id="approvalPanel" class="mb-6"></div>
    <div id="accountsTable"><div class="loading-spinner"><div class="spinner"></div>Đang tải...</div></div>
  `;
  document.getElementById('btnAddAccount')?.addEventListener('click', openCreateAccountModal);
}

function renderUserView(container) {
  container.innerHTML = `
    <div class="page-heading">
      <div>
        <div class="page-heading__title">Hồ sơ & Tài khoản cá nhân</div>
        <div class="page-heading__sub">Thông tin cá nhân, cài đặt bảo mật và tiến độ công việc của bạn</div>
      </div>
      <button class="btn btn-secondary" onclick="showChangePasswordModal()">Đổi mật khẩu</button>
    </div>

    <div class="grid-4 mb-6">
      <div class="kpi-card"><div class="kpi-card__label">Dự án tham gia</div><div class="kpi-card__value" id="usrProjects">--</div></div>
      <div class="kpi-card"><div class="kpi-card__label">Task hoàn thành</div><div class="kpi-card__value" style="-webkit-text-fill-color:var(--green)" id="usrTasks">--</div></div>
      <div class="kpi-card"><div class="kpi-card__label">Tổng giờ làm</div><div class="kpi-card__value" style="-webkit-text-fill-color:var(--accent-2)" id="usrHours">--</div></div>
      <div class="kpi-card"><div class="kpi-card__label">Điểm hiệu suất</div><div class="kpi-card__value" style="-webkit-text-fill-color:var(--cyan)" id="usrScore">--</div></div>
    </div>

    <div class="card mb-6">
      <div class="card__header"><span class="card__title">Thông tin Hồ sơ</span></div>
      <div class="card__body" id="userProfileBody">
        <div class="loading-spinner"><div class="spinner"></div>Đang tải thông tin...</div>
      </div>
    </div>
  `;
}

async function loadUserProfile() {
  const container = document.getElementById('userProfileBody');
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('hrm_token') }
    });
    const acc = await res.json();
    
    const tasks = await api.tasks.list();
    const myTasks = tasks.filter(t => t.assignee?._id === acc.linkedUser?._id);
    const completedTasks = myTasks.filter(t => t.status === 'Completed');
    const myProjects = new Set(myTasks.map(t => t.project?._id)).size;
    
    document.getElementById('usrProjects').textContent = myProjects || 0;
    document.getElementById('usrTasks').textContent = completedTasks.length || 0;
    
    const logs = await api.timelogs.list();
    const myLogs = logs.filter(l => l.staff?._id === acc.linkedUser?._id && l.approvalStatus === 'approved');
    const hours = myLogs.reduce((sum, l) => sum + (l.hoursWorked || 0), 0);
    document.getElementById('usrHours').textContent = hours.toFixed(1);
    
    document.getElementById('usrScore').textContent = acc.linkedUser?.performanceScore || 'N/A';
    
    container.innerHTML = `
      <div style="display:flex;gap:24px;align-items:center;">
        ${mkAvatar(acc.fullName, 'lg')}
        <div>
          <h3 style="color:#f1f5f9;margin-bottom:8px;font-size:20px">${acc.fullName}</h3>
          <p style="color:#94a3b8;font-size:14px;margin-bottom:4px"><strong style="color:#cbd5e1">Chức danh:</strong> ${acc.linkedUser?.position || 'Chưa cập nhật'}</p>
          <p style="color:#94a3b8;font-size:14px;margin-bottom:4px"><strong style="color:#cbd5e1">Email:</strong> ${acc.email || 'Chưa cập nhật'}</p>
          <p style="color:#94a3b8;font-size:14px;margin-bottom:4px"><strong style="color:#cbd5e1">Phòng ban:</strong> ${acc.linkedUser?.department?.name || 'Chưa phân bổ'}</p>
          <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
            ${(acc.linkedUser?.skills || []).map(s => `<span class="badge badge-active">${s}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    if(container) container.innerHTML = `<div class="empty-state">Lỗi: ${err.message}</div>`;
  }
}

async function loadAccounts() {
  const container = document.getElementById('accountsTable');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div>Äang táº£i...</div>';
  try {
    const accounts = await api.accounts.list();
    renderAccountsTable(accounts);
    updateAccountStats(accounts);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Lá»—i táº£i dá»¯ liá»‡u</div><div class="empty-state__sub">${err.message}</div></div>`;
  }
}

function updateAccountStats(accounts) {
  const total    = accounts.length;
  const admins   = accounts.filter(a => a.role === 'admin').length;
  const users    = accounts.filter(a => a.role === 'user').length;
  const inactive = accounts.filter(a => !a.active).length;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('accTotal',    total);
  set('accAdmins',   admins);
  set('accUsers',    users);
  set('accInactive', inactive);
}

function renderAccountsTable(accounts) {
  const container = document.getElementById('accountsTable');
  if (!accounts.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state__title">ChÆ°a cÃ³ tÃ i khoáº£n nÃ o</div></div>';
    return;
  }
  const currentUser = state.currentUser || {};
  container.innerHTML = `
  <div class="table-wrap">
    <table>
      <thead><tr>
        <th>TÃ i khoáº£n</th>
        <th>Username</th>
        <th>Email</th>
        <th>Vai trÃ²</th>
        <th>Tráº¡ng thÃ¡i</th>
        <th>Sá»‘ láº§n Ä‘Äƒng nháº­p</th>
        <th>ÄÄƒng nháº­p láº§n cuá»‘i</th>
        <th>Ghi chÃº Admin</th>
        <th>HÃ nh Ä‘á»™ng</th>
      </tr></thead>
      <tbody>
        ${accounts.map(acc => {
          const isMe      = acc._id === currentUser.id;
          const roleLabel = acc.role === 'admin' ? 'Quáº£n trá»‹ viÃªn' : 'NgÆ°á»i dÃ¹ng';
          const roleCls   = acc.role === 'admin' ? 'badge-urgent' : 'badge-active';
          const statusLabel = acc.active ? 'Hoáº¡t Ä‘á»™ng' : 'VÃ´ hiá»‡u';
          const statusCls   = acc.active ? 'badge-active' : 'badge-hold';
          return `<tr class="${!acc.active ? 'row-inactive' : ''}">
            <td>
              <div class="td-name">
                ${mkAvatar(acc.fullName, 'sm')}
                <div>
                  <div>${acc.fullName} ${isMe ? '<span style="font-size:10px;color:var(--accent-3)">(Báº¡n)</span>' : ''}</div>
                  <div class="td-sub">Táº¡o: ${formatDate(acc.createdAt)}</div>
                </div>
              </div>
            </td>
            <td><code style="font-size:12px;background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:4px;color:var(--cyan)">${acc.username}</code></td>
            <td><span style="font-size:12px;color:var(--text-secondary)">${acc.email || '--'}</span></td>
            <td><span class="badge ${roleCls}">${roleLabel}</span></td>
            <td><span class="badge ${statusCls}">${statusLabel}</span></td>
            <td style="text-align:center"><span style="font-size:13px;font-weight:600;color:var(--text-primary)">${acc.loginCount || 0}</span></td>
            <td><span style="font-size:11px;color:var(--text-muted)">${acc.lastLogin ? formatDateTime(acc.lastLogin) : 'â€”'}</span></td>
            <td>${acc.adminNote ? `<span class="account-note">${acc.adminNote}</span>` : '<span style="color:var(--text-muted);font-size:11px">â€”</span>'}</td>
            <td>
              <div style="display:flex;gap:4px;flex-wrap:wrap">
                <button class="btn btn-ghost btn-xs" onclick="editAccount('${acc._id}')">Sá»­a</button>
                <button class="btn btn-secondary btn-xs" onclick="resetAccountPassword('${acc._id}', '${acc.username}')">Äáº·t láº¡i MK</button>
                ${!acc.active
                  ? `<button class="btn btn-xs" style="background:rgba(52,211,153,0.1);color:var(--green);border:1px solid rgba(52,211,153,0.3)" onclick="toggleAccountActive('${acc._id}', true)">KÃ­ch hoáº¡t</button>`
                  : !isMe && acc.username !== 'admin' ? `<button class="btn btn-xs" style="background:rgba(251,191,36,0.1);color:var(--yellow);border:1px solid rgba(251,191,36,0.3)" onclick="toggleAccountActive('${acc._id}', false)">VÃ´ hiá»‡u hoÃ¡</button>` : ''}
                ${!isMe && acc.username !== 'admin' ? `<button class="btn btn-danger btn-xs" onclick="deleteAccount('${acc._id}', '${acc.username}')">XoÃ¡</button>` : ''}
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Báº£ng phÃª duyá»‡t (Admin) â€” Hiá»ƒn thá»‹ task & timelog chá» duyá»‡t
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function loadApprovalPanel() {
  const panel = document.getElementById('approvalPanel');
  if (!panel) return;
  panel.innerHTML = '<div class="loading-spinner"><div class="spinner"></div>Äang táº£i yÃªu cáº§u chá» duyá»‡t...</div>';
  try {
    const [pendingTasks, pendingLogs, tlStats] = await Promise.all([
      api.tasks.pendingApproval(),
      api.timelogs.pending(),
      api.timelogs.approvalStats(),
    ]);

    // Cáº­p nháº­t badge
    const badge = document.getElementById('approvalBadge');
    const total  = (pendingTasks.length + pendingLogs.length);
    if (badge) badge.textContent = total > 0 ? total : '';

    let html = '';

    // â”€â”€ Pending Tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (pendingTasks.length > 0) {
      html += `
      <div class="approval-panel" style="margin-bottom:20px">
        <div class="approval-panel__title">
          <span>CÃ´ng viá»‡c chá» duyá»‡t hoÃ n thÃ nh (${pendingTasks.length})</span>
          <span style="font-size:11px;font-weight:400;color:var(--text-muted)">NhÃ¢n viÃªn Ä‘Ã¡nh dáº¥u hoÃ n thÃ nh, cáº§n admin xÃ¡c nháº­n</span>
        </div>
        ${pendingTasks.map(t => `
        <div class="approval-item">
          ${t.assignee ? mkAvatar(t.assignee.fullName, 'sm') : '<div class="avatar avatar-sm" style="background:#475569">?</div>'}
          <div class="approval-item__info">
            <div class="approval-item__name">${t.name}</div>
            <div class="approval-item__sub">
              ${t.project?.name || ''} &middot;
              ${t.assignee?.fullName || 'ChÆ°a phÃ¢n cÃ´ng'} &middot;
              Gá»­i duyá»‡t: ${formatDateTime(t.updatedAt)}
              ${t.approvalNote ? ` &middot; <em>"${t.approvalNote}"</em>` : ''}
            </div>
          </div>
          ${priorityBadge(t.priority)}
          <div class="approval-item__actions">
            <button class="btn btn-xs" style="background:rgba(52,211,153,0.15);color:var(--green);border:1px solid rgba(52,211,153,0.3)"
              onclick="approveTask('${t._id}','approved')">Duyá»‡t</button>
            <button class="btn btn-xs" style="background:rgba(248,113,113,0.15);color:var(--red);border:1px solid rgba(248,113,113,0.3)"
              onclick="approveTask('${t._id}','rejected')">Tá»« chá»‘i</button>
          </div>
        </div>`).join('')}
      </div>`;
    }

    // â”€â”€ Pending TimeLogs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const statsHtml = `
    <div style="display:flex;gap:12px;margin-bottom:14px;font-size:12px">
      <span style="color:var(--yellow)">Chá» duyá»‡t: <strong>${tlStats.pending}</strong></span>
      <span style="color:var(--green)">ÄÃ£ duyá»‡t: <strong>${tlStats.approved}</strong></span>
      <span style="color:var(--red)">Tá»« chá»‘i: <strong>${tlStats.rejected}</strong></span>
    </div>`;

    if (pendingLogs.length > 0) {
      html += `
      <div class="approval-panel">
        <div class="approval-panel__title">
          <span>Giá» lÃ m chá» duyá»‡t (${pendingLogs.length})</span>
          <span style="font-size:11px;font-weight:400;color:var(--text-muted)">NhÃ¢n viÃªn ghi nháº­n, cáº§n admin xÃ¡c nháº­n</span>
        </div>
        ${statsHtml}
        ${pendingLogs.map(l => `
        <div class="approval-item">
          ${mkAvatar(l.staff?.fullName || '?', 'sm')}
          <div class="approval-item__info">
            <div class="approval-item__name">${l.staff?.fullName || '--'} â€” <span style="color:var(--accent-3)">${l.hoursWorked}h</span></div>
            <div class="approval-item__sub">
              ${l.task?.name || ''} / ${l.task?.project?.name || ''} &middot;
              ${formatDate(l.date)}
              ${l.notes ? ` &middot; <em>"${l.notes}"</em>` : ''}
            </div>
          </div>
          ${l.qualityRating ? `<span class="badge badge-active" style="flex-shrink:0">â˜… ${l.qualityRating}/5</span>` : ''}
          <div class="approval-item__actions">
            <button class="btn btn-xs" style="background:rgba(52,211,153,0.15);color:var(--green);border:1px solid rgba(52,211,153,0.3)"
              onclick="approveTimelog('${l._id}','approved')">Duyá»‡t</button>
            <button class="btn btn-xs" style="background:rgba(248,113,113,0.15);color:var(--red);border:1px solid rgba(248,113,113,0.3)"
              onclick="approveTimelog('${l._id}','rejected')">Tá»« chá»‘i</button>
          </div>
        </div>`).join('')}
      </div>`;
    }

    if (!pendingTasks.length && !pendingLogs.length) {
      html = `<div class="empty-state" style="padding:24px">
        <div class="empty-state__title" style="color:var(--green)">KhÃ´ng cÃ³ yÃªu cáº§u chá» duyá»‡t</div>
        <div class="empty-state__sub">Táº¥t cáº£ cÃ´ng viá»‡c vÃ  giá» lÃ m Ä‘Ã£ Ä‘Æ°á»£c xá»­ lÃ½</div>
      </div>`;
    }

    panel.innerHTML = html;
  } catch (err) {
    panel.innerHTML = `<div class="empty-state"><div class="empty-state__sub">${err.message}</div></div>`;
  }
}

// â”€â”€ Duyá»‡t task â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function approveTask(id, action) {
  if (action === 'rejected') {
    modal.open({
      title: 'LÃ½ do tá»« chá»‘i',
      body: `<div class="form-group"><label class="form-label">Ghi chÃº lÃ½ do tá»« chá»‘i</label><textarea id="f-reject-note" class="form-control" placeholder="NÃªu lÃ½ do..." style="height:80px"></textarea></div>`,
      confirmText: 'XÃ¡c nháº­n tá»« chá»‘i',
      onConfirm: async () => {
        const note = document.getElementById('f-reject-note').value;
        try {
          modal.setLoading(true);
          const u = state.currentUser;
          await api.tasks.approve(id, { action: 'rejected', note, approverId: u?.id });
          modal.close(); showToast('ÄÃ£ tá»« chá»‘i yÃªu cáº§u'); loadApprovalPanel(); loadTasks?.();
        } catch (err) { showToast('Lá»—i: ' + err.message, 'error'); }
        finally { modal.setLoading(false); }
      },
    });
    return;
  }
  try {
    const u = state.currentUser;
    await api.tasks.approve(id, { action: 'approved', approverId: u?.id });
    showToast('ÄÃ£ duyá»‡t cÃ´ng viá»‡c hoÃ n thÃ nh');
    loadApprovalPanel(); loadTasks?.();
  } catch (err) { showToast('Lá»—i: ' + err.message, 'error'); }
}

// â”€â”€ Duyá»‡t timelog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function approveTimelog(id, action) {
  if (action === 'rejected') {
    modal.open({
      title: 'Tá»« chá»‘i giá» lÃ m',
      body: `<div class="form-group"><label class="form-label">LÃ½ do tá»« chá»‘i</label><textarea id="f-reject-tl" class="form-control" placeholder="Nháº­p lÃ½ do..." style="height:80px"></textarea></div>`,
      confirmText: 'Tá»« chá»‘i',
      onConfirm: async () => {
        const reason = document.getElementById('f-reject-tl').value;
        try {
          modal.setLoading(true);
          await api.timelogs.approve(id, { action: 'rejected', reason });
          modal.close(); showToast('ÄÃ£ tá»« chá»‘i giá» lÃ m'); loadApprovalPanel();
        } catch (err) { showToast('Lá»—i: ' + err.message, 'error'); }
        finally { modal.setLoading(false); }
      },
    });
    return;
  }
  try {
    await api.timelogs.approve(id, { action: 'approved' });
    showToast('ÄÃ£ duyá»‡t giá» lÃ m'); loadApprovalPanel();
  } catch (err) { showToast('Lá»—i: ' + err.message, 'error'); }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Password Strength Checker
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderPwStrength(pw, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const checks = {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[!@#$%^&*()\-_,.?":{}|<>]/.test(pw),
  };
  const score    = Object.values(checks).filter(Boolean).length;
  const strength = score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'good' : 'strong';
  const label    = { weak: 'Yáº¿u', fair: 'Trung bÃ¬nh', good: 'KhÃ¡', strong: 'Máº¡nh' }[strength];
  const color    = { weak: 'var(--red)', fair: 'var(--yellow)', good: 'var(--cyan)', strong: 'var(--green)' }[strength];
  container.innerHTML = `
  <div class="pw-strength">
    <div class="pw-strength__bar">
      ${[1,2,3,4].map(i => `<div class="pw-strength__seg ${i <= score ? strength : ''}"></div>`).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <div class="pw-strength__checks">
        <span class="pw-check ${checks.length ? 'pass' : 'fail'}">8+ kÃ½ tá»±</span>
        <span class="pw-check ${checks.upper  ? 'pass' : 'fail'}">Chá»¯ hoa</span>
        <span class="pw-check ${checks.number ? 'pass' : 'fail'}">Sá»‘</span>
        <span class="pw-check ${checks.special? 'pass' : 'fail'}">KÃ½ tá»± Ä‘áº·c biá»‡t</span>
      </div>
      ${pw ? `<span style="font-size:11px;color:${color};font-weight:600">${label}</span>` : ''}
    </div>
  </div>`;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Form Táº¡o / Sá»­a TÃ i khoáº£n (vá»›i password strength)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function getAccountFormHtml(acc = {}, isEdit = false) {
  const userOptions = (state.users || []).map(u =>
    `<option value="${u._id}" ${acc.linkedUser?._id === u._id ? 'selected' : ''}>${u.fullName}</option>`
  ).join('');
  return `
  <div class="form-row">
    <div class="form-group">
      <label class="form-label">Há» tÃªn *</label>
      <input id="f-acc-name" class="form-control" value="${acc.fullName || ''}" placeholder="Nguyá»…n VÄƒn A">
    </div>
    <div class="form-group">
      <label class="form-label">Email</label>
      <input id="f-acc-email" class="form-control" type="email" value="${acc.email || ''}">
    </div>
  </div>
  <div class="form-row">
    <div class="form-group">
      <label class="form-label">Username * ${isEdit ? '<span style="font-size:10px;color:var(--text-muted)">(khÃ´ng thá»ƒ Ä‘á»•i)</span>' : '<span style="font-size:10px;color:var(--text-muted)">(chá»‰ chá»¯ thÆ°á»ng, sá»‘, gáº¡ch dÆ°á»›i)</span>'}</label>
      <input id="f-acc-username" class="form-control" value="${acc.username || ''}" placeholder="ten_dang_nhap" ${isEdit ? 'readonly style="opacity:0.6"' : ''}>
    </div>
    ${!isEdit ? `
    <div class="form-group">
      <label class="form-label">Máº­t kháº©u *</label>
      <input id="f-acc-password" class="form-control" type="password" placeholder="Tá»‘i thiá»ƒu 8 kÃ½ tá»±..."
        oninput="renderPwStrength(this.value,'pwStrengthBox')">
      <div id="pwStrengthBox"></div>
    </div>` : '<div></div>'}
  </div>
  <div class="form-row">
    <div class="form-group">
      <label class="form-label">Vai trÃ²</label>
      <select id="f-acc-role" class="form-control">
        <option value="user" ${acc.role === 'user' || !acc.role ? 'selected' : ''}>NgÆ°á»i dÃ¹ng</option>
        <option value="admin" ${acc.role === 'admin' ? 'selected' : ''}>Quáº£n trá»‹ viÃªn</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Tráº¡ng thÃ¡i</label>
      <select id="f-acc-active" class="form-control">
        <option value="true" ${acc.active !== false ? 'selected' : ''}>Hoáº¡t Ä‘á»™ng</option>
        <option value="false" ${acc.active === false ? 'selected' : ''}>VÃ´ hiá»‡u hoÃ¡</option>
      </select>
    </div>
  </div>
  <div class="form-group">
    <label class="form-label">LiÃªn káº¿t vá»›i nhÃ¢n viÃªn (tuá»³ chá»n)</label>
    <select id="f-acc-linked" class="form-control">
      <option value="">-- KhÃ´ng liÃªn káº¿t --</option>
      ${userOptions}
    </select>
  </div>
  <div class="form-group">
    <label class="form-label">Ghi chÃº ná»™i bá»™ (chá»‰ admin tháº¥y)</label>
    <input id="f-acc-note" class="form-control" value="${acc.adminNote || ''}" placeholder="Ghi chÃº ná»™i bá»™...">
  </div>
  <div style="padding:10px 12px;background:rgba(99,102,241,0.08);border-radius:8px;font-size:11.5px;color:var(--text-secondary)">
    <strong style="color:var(--accent-3)">Quáº£n trá»‹ viÃªn:</strong> ToÃ n quyá»n truy cáº­p, quáº£n lÃ½ tÃ i khoáº£n, duyá»‡t cÃ´ng viá»‡c &amp; giá» lÃ m.<br>
    <strong style="color:var(--cyan)">NgÆ°á»i dÃ¹ng:</strong> Xem vÃ  thao tÃ¡c dá»¯ liá»‡u, ghi nháº­n giá» lÃ m, gá»­i yÃªu cáº§u duyá»‡t.
  </div>`;
}

// YÃªu cáº§u máº­t kháº©u há»£p lá»‡
function validatePw(pw) {
  if (!pw || pw.length < 8)             return 'Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 8 kÃ½ tá»±';
  if (!/[A-Z]/.test(pw))               return 'Cáº§n Ã­t nháº¥t 1 chá»¯ hoa (A-Z)';
  if (!/[0-9]/.test(pw))               return 'Cáº§n Ã­t nháº¥t 1 chá»¯ sá»‘ (0-9)';
  if (!/[!@#$%^&*()\-_,.?":{}|<>]/.test(pw)) return 'Cáº§n Ã­t nháº¥t 1 kÃ½ tá»± Ä‘áº·c biá»‡t (!@#...)';
  return null;
}

function openCreateAccountModal() {
  modal.open({
    title: 'Táº¡o tÃ i khoáº£n má»›i', body: getAccountFormHtml({}, false), confirmText: 'Táº¡o tÃ i khoáº£n', wide: true,
    onConfirm: async () => {
      const pw = document.getElementById('f-acc-password')?.value || '';
      const pwErr = validatePw(pw);
      if (pwErr) return showToast(pwErr, 'error');
      const un = document.getElementById('f-acc-username').value.trim();
      if (!/^[a-z0-9_]+$/.test(un)) return showToast('Username chá»‰ dÃ¹ng chá»¯ thÆ°á»ng, sá»‘ vÃ  dáº¥u gáº¡ch dÆ°á»›i', 'error');
      const body = {
        fullName:   document.getElementById('f-acc-name').value.trim(),
        email:      document.getElementById('f-acc-email').value.trim(),
        username:   un,
        password:   pw,
        role:       document.getElementById('f-acc-role').value,
        active:     document.getElementById('f-acc-active').value === 'true',
        linkedUser: document.getElementById('f-acc-linked').value || null,
        adminNote:  document.getElementById('f-acc-note').value.trim(),
      };
      if (!body.fullName) return showToast('Vui lÃ²ng nháº­p há» tÃªn', 'error');
      if (!body.username) return showToast('Vui lÃ²ng nháº­p username', 'error');
      try {
        modal.setLoading(true);
        await api.accounts.create(body);
        modal.close(); showToast('ÄÃ£ táº¡o tÃ i khoáº£n thÃ nh cÃ´ng'); loadAccounts();
      } catch (err) { showToast('Lá»—i: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
}

async function editAccount(id) {
  try {
    const accounts = await api.accounts.list();
    const acc = accounts.find(a => a._id === id);
    if (!acc) return showToast('KhÃ´ng tÃ¬m tháº¥y tÃ i khoáº£n', 'error');
    modal.open({
      title: 'Cáº­p nháº­t tÃ i khoáº£n', body: getAccountFormHtml(acc, true), confirmText: 'Cáº­p nháº­t', wide: true,
      onConfirm: async () => {
        const body = {
          fullName:   document.getElementById('f-acc-name').value.trim(),
          email:      document.getElementById('f-acc-email').value.trim(),
          role:       document.getElementById('f-acc-role').value,
          active:     document.getElementById('f-acc-active').value === 'true',
          linkedUser: document.getElementById('f-acc-linked').value || null,
          adminNote:  document.getElementById('f-acc-note').value.trim(),
        };
        if (!body.fullName) return showToast('Vui lÃ²ng nháº­p há» tÃªn', 'error');
        try {
          modal.setLoading(true);
          await api.accounts.update(id, body);
          modal.close(); showToast('ÄÃ£ cáº­p nháº­t tÃ i khoáº£n'); loadAccounts();
        } catch (err) { showToast('Lá»—i: ' + err.message, 'error'); }
        finally { modal.setLoading(false); }
      },
    });
  } catch (err) { showToast('Lá»—i: ' + err.message, 'error'); }
}

async function toggleAccountActive(id, activate) {
  try {
    await api.accounts.update(id, { active: activate });
    showToast(activate ? 'ÄÃ£ kÃ­ch hoáº¡t tÃ i khoáº£n' : 'ÄÃ£ vÃ´ hiá»‡u hoÃ¡ tÃ i khoáº£n');
    loadAccounts();
  } catch (err) { showToast('Lá»—i: ' + err.message, 'error'); }
}

function resetAccountPassword(id, username) {
  modal.open({
    title: `Äáº·t láº¡i máº­t kháº©u â€” ${username}`,
    body: `
    <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">Máº­t kháº©u má»›i pháº£i Ä‘Ã¡p á»©ng yÃªu cáº§u báº£o máº­t.</p>
    <div class="form-group">
      <label class="form-label">Máº­t kháº©u má»›i *</label>
      <input id="f-reset-pw" class="form-control" type="password" placeholder="Tá»‘i thiá»ƒu 8 kÃ½ tá»±..."
        oninput="renderPwStrength(this.value,'resetPwStrength')">
      <div id="resetPwStrength"></div>
    </div>
    <div class="form-group">
      <label class="form-label">Nháº­p láº¡i máº­t kháº©u</label>
      <input id="f-reset-pw2" class="form-control" type="password" placeholder="Nháº­p láº¡i máº­t kháº©u má»›i">
    </div>`,
    confirmText: 'Äáº·t láº¡i máº­t kháº©u',
    onConfirm: async () => {
      const pw  = document.getElementById('f-reset-pw').value;
      const pw2 = document.getElementById('f-reset-pw2').value;
      const err = validatePw(pw);
      if (err)      return showToast(err, 'error');
      if (pw !== pw2) return showToast('Máº­t kháº©u nháº­p láº¡i khÃ´ng khá»›p', 'error');
      try {
        modal.setLoading(true);
        await api.accounts.resetPassword(id, { newPassword: pw });
        modal.close(); showToast('ÄÃ£ Ä‘áº·t láº¡i máº­t kháº©u thÃ nh cÃ´ng');
      } catch (err) { showToast('Lá»—i: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
}

function deleteAccount(id, username) {
  modal.open({
    title: 'XÃ¡c nháº­n xoÃ¡ tÃ i khoáº£n',
    body: `<p style="color:var(--text-secondary)">Báº¡n cÃ³ cháº¯c muá»‘n xoÃ¡ tÃ i khoáº£n <strong style="color:var(--text-primary)">${username}</strong>?<br>HÃ nh Ä‘á»™ng nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c.</p>`,
    confirmText: 'XoÃ¡ tÃ i khoáº£n',
    onConfirm: async () => {
      try {
        modal.setLoading(true);
        await api.accounts.remove(id);
        modal.close(); showToast('ÄÃ£ xoÃ¡ tÃ i khoáº£n'); loadAccounts();
      } catch (err) { showToast('Lá»—i: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
}

// â”€â”€ Äá»•i máº­t kháº©u cá»§a chÃ­nh mÃ¬nh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showChangePasswordModal() {
  modal.open({
    title: 'Äá»•i máº­t kháº©u',
    body: `
    <div class="form-group"><label class="form-label">Máº­t kháº©u hiá»‡n táº¡i</label><input id="f-cp-old" class="form-control" type="password" placeholder="Máº­t kháº©u hiá»‡n táº¡i"></div>
    <div class="form-group">
      <label class="form-label">Máº­t kháº©u má»›i</label>
      <input id="f-cp-new" class="form-control" type="password" placeholder="Tá»‘i thiá»ƒu 8 kÃ½ tá»±, 1 chá»¯ hoa, 1 sá»‘, 1 kÃ½ tá»± Ä‘áº·c biá»‡t"
        oninput="renderPwStrength(this.value,'cpPwStrength')">
      <div id="cpPwStrength"></div>
    </div>
    <div class="form-group"><label class="form-label">Nháº­p láº¡i máº­t kháº©u má»›i</label><input id="f-cp-new2" class="form-control" type="password" placeholder="Nháº­p láº¡i"></div>`,
    confirmText: 'Äá»•i máº­t kháº©u',
    onConfirm: async () => {
      const oldPw  = document.getElementById('f-cp-old').value;
      const newPw  = document.getElementById('f-cp-new').value;
      const newPw2 = document.getElementById('f-cp-new2').value;
      if (!oldPw) return showToast('Vui lÃ²ng nháº­p máº­t kháº©u hiá»‡n táº¡i', 'error');
      const err = validatePw(newPw);
      if (err)            return showToast(err, 'error');
      if (newPw !== newPw2) return showToast('Máº­t kháº©u nháº­p láº¡i khÃ´ng khá»›p', 'error');
      try {
        modal.setLoading(true);
        await api.auth.changePassword({ currentPassword: oldPw, newPassword: newPw });
        modal.close(); showToast('Äá»•i máº­t kháº©u thÃ nh cÃ´ng!');
      } catch (err) { showToast('Lá»—i: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
}

