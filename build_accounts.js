const fs = require('fs');

let oldContent = fs.readFileSync('C:/Users/Quan/.gemini/antigravity-ide/scratch/hr-resource-system/accounts_old.js', 'utf8');

const splitIndex = oldContent.indexOf('async function loadAccounts()');
let oldFunctions = oldContent.substring(splitIndex);

// Replace button listener with function
oldFunctions = oldFunctions.replace(
  /document\.getElementById\('btnAddAccount'\)\?\.addEventListener\('click', \(\) => \{/g,
  'function openCreateAccountModal() {'
);
oldFunctions = oldFunctions.replace(
  /\}\);\s*async function editAccount/g,
  '}\n\nasync function editAccount'
);

// Replace Vô hiệu hoá with Ban, etc
oldFunctions = oldFunctions.replace(/Vô hiệu hoá/g, 'Ban');
oldFunctions = oldFunctions.replace(/Kích hoạt/g, 'Unban');
oldFunctions = oldFunctions.replace(/Vô hiệu/g, 'Banned');


const newHeader = `/* ─── accounts.js — Quản lý Tài khoản & Phê duyệt ─── */

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
  container.innerHTML = \`
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
  \`;
  document.getElementById('btnAddAccount')?.addEventListener('click', openCreateAccountModal);
}

function renderUserView(container) {
  container.innerHTML = \`
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
  \`;
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
    
    container.innerHTML = \`
      <div style="display:flex;gap:24px;align-items:center;">
        \${mkAvatar(acc.fullName, 'lg')}
        <div>
          <h3 style="color:#f1f5f9;margin-bottom:8px;font-size:20px">\${acc.fullName}</h3>
          <p style="color:#94a3b8;font-size:14px;margin-bottom:4px"><strong style="color:#cbd5e1">Chức danh:</strong> \${acc.linkedUser?.position || 'Chưa cập nhật'}</p>
          <p style="color:#94a3b8;font-size:14px;margin-bottom:4px"><strong style="color:#cbd5e1">Email:</strong> \${acc.email || 'Chưa cập nhật'}</p>
          <p style="color:#94a3b8;font-size:14px;margin-bottom:4px"><strong style="color:#cbd5e1">Phòng ban:</strong> \${acc.linkedUser?.department?.name || 'Chưa phân bổ'}</p>
          <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
            \${(acc.linkedUser?.skills || []).map(s => \`<span class="badge badge-active">\${s}</span>\`).join('')}
          </div>
        </div>
      </div>
    \`;
  } catch (err) {
    if(container) container.innerHTML = \`<div class="empty-state">Lỗi: \${err.message}</div>\`;
  }
}

`;

fs.writeFileSync('public/js/accounts.js', newHeader + oldFunctions, 'utf8');
console.log('accounts.js rebuilt successfully');
