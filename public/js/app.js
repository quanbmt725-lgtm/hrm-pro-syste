/* ─── app.js — Router, Utilities, Modal, Toast ──────────────────────────── */

// ── Global State ──────────────────────────────────────────────────────────────
const state = {
  departments: [],
  users: [],
  projects: [],
  currentSection: 'dashboard',
};

// ── Chart.js Defaults (Dark Theme) ────────────────────────────────────────────
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = 'Inter';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(name) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#06b6d4','#10b981','#f59e0b','#ef4444','#3b82f6'];
  let hash = 0;
  for (const c of (name || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function mkAvatar(name, size = '') {
  const color = avatarColor(name);
  const cls = size ? `avatar avatar-${size}` : 'avatar';
  return `<div class="${cls}" style="background:${color}">${getInitials(name)}</div>`;
}

function statusBadge(status) {
  const map = {
    'Active':       ['badge-active',      'Đang hoạt động'],
    'Planning':     ['badge-planning',    'Lên kế hoạch'],
    'On Hold':      ['badge-hold',        'Tạm dừng'],
    'Completed':    ['badge-completed',   'Hoàn thành'],
    'Not Started':  ['badge-not-started', 'Chưa bắt đầu'],
    'In Progress':  ['badge-in-progress', 'Đang thực hiện'],
  };
  const [cls, label] = map[status] || ['badge-not-started', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function priorityBadge(priority) {
  const map = {
    'Low':    ['badge-low',    'Thấp'],
    'Medium': ['badge-medium', 'Trung bình'],
    'High':   ['badge-high',   'Cao'],
    'Urgent': ['badge-urgent', 'Khẩn cấp'],
  };
  const [cls, label] = map[priority] || ['badge-low', priority];
  return `<span class="badge ${cls}">${label}</span>`;
}

function clusterBadge(cluster, label) {
  const map = { high: 'badge-cluster-high', medium: 'badge-cluster-medium', low: 'badge-cluster-low' };
  return `<span class="badge ${map[cluster] || ''}">${label}</span>`;
}

function formatDate(dateStr, short = false) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (short) return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

function isOverdue(deadline) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function workloadStatus(pct) {
  if (pct <= 40) return { label: 'Rảnh rỗi',        color: 'var(--green)' };
  if (pct <= 70) return { label: 'Bình thường',      color: 'var(--cyan)' };
  if (pct <= 85) return { label: 'Tương đối bận',    color: 'var(--yellow)' };
  return           { label: 'Quá tải',          color: 'var(--red)' };
}

function skillTagsHtml(skills = [], requiredSkills = []) {
  if (!skills.length) return '<span class="text-xs text-muted">Chưa có kỹ năng</span>';
  return skills.map(s => {
    let cls = 'skill-tag';
    if (requiredSkills.length) {
      const match = requiredSkills.map(r => r.toLowerCase()).includes(s.toLowerCase());
      cls += match ? ' matched' : '';
    }
    return `<span class="${cls}">${s}</span>`;
  }).join('');
}

// ── Toast Notifications ───────────────────────────────────────────────────────
function showToast(msg, type = 'success', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast__text">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = '0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Modal System ──────────────────────────────────────────────────────────────
const modal = {
  overlay: null, el: null, confirmCb: null,
  init() {
    this.overlay = document.getElementById('modalOverlay');
    this.el = document.getElementById('mainModal');
    document.getElementById('modalClose').addEventListener('click', () => this.close());
    document.getElementById('modalCancel').addEventListener('click', () => this.close());
    document.getElementById('modalConfirm').addEventListener('click', () => { if (this.confirmCb) this.confirmCb(); });
    this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
  },
  open({ title, body, confirmText = 'Lưu', onConfirm, hideFooter = false, wide = false }) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalConfirm').textContent = confirmText;
    document.getElementById('modalFooter').style.display = hideFooter ? 'none' : 'flex';
    this.el.classList.toggle('modal--wide', !!wide);
    this.confirmCb = onConfirm || null;
    this.overlay.classList.add('open');
  },
  close() {
    this.overlay.classList.remove('open');
    this.confirmCb = null;
  },
  setLoading(loading) {
    const btn = document.getElementById('modalConfirm');
    btn.disabled = loading;
    if (loading) { btn._text = btn.textContent; btn.textContent = 'Đang lưu...'; }
    else btn.textContent = btn._text || 'Lưu';
  },
};

// ── Router ────────────────────────────────────────────────────────────────────
const sectionTitles = {
  dashboard:   'Tổng quan',
  projects:    'Dự án & Công việc',
  resources:   'Nguồn lực & AI Optimizer',
  performance: 'Hiệu suất Nhân sự',
  accounts:    'Quản lý Tài khoản',
};

function navigate(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const el = document.getElementById(`section-${section}`);
  const nav = document.getElementById(`nav-${section}`);
  if (el) el.classList.add('active');
  if (nav) nav.classList.add('active');

  document.getElementById('pageTitle').textContent = sectionTitles[section] || section;
  state.currentSection = section;

  if (section === 'dashboard')   loadDashboard();
  if (section === 'projects')    loadProjectsSection();
  if (section === 'resources')   loadResourcesSection();
  if (section === 'performance') loadPerformanceSection();
  if (section === 'accounts')    loadAccountsSection();
}

// ── Clock ─────────────────────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('headerTime');
  if (el) el.textContent = new Date().toLocaleString('vi-VN', {
    weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

// ── DB Status ─────────────────────────────────────────────────────────────────
async function checkDbStatus() {
  try {
    await api.get('/api/health');
    document.getElementById('dbDot').className = 'db-status__dot';
    document.getElementById('dbStatusText').textContent = 'Đã kết nối CSDL';
  } catch {
    document.getElementById('dbDot').className = 'db-status__dot error';
    document.getElementById('dbStatusText').textContent = 'Lỗi kết nối CSDL';
  }
}

// ── Load shared data ──────────────────────────────────────────────────────────
async function loadSharedData() {
  try {
    const [depts, users, projects] = await Promise.all([
      api.departments.list(),
      api.users.list(),
      api.projects.list(),
    ]);
    state.departments = depts;
    state.users = users;
    state.projects = projects;

    populateSelectOptions('filterProjectDept', depts, 'Tất cả phòng ban');
    populateSelectOptions('filterUserDept',    depts, 'Tất cả phòng ban');
    populateSelectOptions('filterPerfDept',    depts, 'Tất cả phòng ban');
    populateSelectOptions('filterTaskProject', projects, 'Tất cả dự án', '_id', 'name');
    populateSelectOptions('filterTaskAssignee', users,   'Tất cả nhân viên', '_id', 'fullName');
  } catch (err) {
    console.error('loadSharedData:', err);
  }
}

function populateSelectOptions(selectId, items, placeholder, valKey = '_id', labelKey = 'name') {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '';
  if (placeholder) sel.appendChild(new Option(placeholder, ''));
  items.forEach(item => sel.appendChild(new Option(item[labelKey] || item.fullName, item[valKey] || item._id)));
}

// ── Tab switching ─────────────────────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('.tab-btn');
  if (tabBtn) {
    const container = tabBtn.closest('.section') || document;
    container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tabBtn.classList.add('active');
    const panelId = tabBtn.dataset.tab;
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('active');
      if (panelId === 'tasks-tab')    loadTasks();
      if (panelId === 'projects-tab') loadProjects();
    }
  }
});

// ── Auth Check & Init ────────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('hrm_token');
  localStorage.removeItem('hrm_user');
  window.location.href = '/login.html';
}

function initUserUI() {
  const raw = localStorage.getItem('hrm_user');
  if (!raw) { logout(); return; }
  const user = JSON.parse(raw);
  state.currentUser = user;

  // Header avatar + name
  const avatarEl = document.getElementById('headerAvatar');
  if (avatarEl) {
    avatarEl.textContent = getInitials(user.fullName);
    avatarEl.style.background = avatarColor(user.fullName);
  }
  const nameEl   = document.getElementById('headerUserName');
  const roleEl   = document.getElementById('headerUserRole');
  const menuName = document.getElementById('menuUserName');
  const menuEmail= document.getElementById('menuUserEmail');
  if (nameEl)  nameEl.textContent  = user.fullName || user.username;
  if (roleEl)  roleEl.textContent  = user.role === 'admin' ? 'Quản trị viên' : 'Người dùng';
  if (menuName)  menuName.textContent  = user.fullName;
  if (menuEmail) menuEmail.textContent = user.email || user.username;

  // Admin-only: show accounts menu
  if (user.role === 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
  }

  // User dropdown toggle
  const trigger = document.getElementById('userDropdownTrigger');
  const menu    = document.getElementById('userDropdownMenu');
  if (trigger && menu) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
    });
    document.addEventListener('click', () => menu.classList.remove('open'));
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // ── Auth guard: redirect về login nếu chưa có token ──────────────────────
  const token = localStorage.getItem('hrm_token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  modal.init();
  initUserUI();

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.section));
  });

  updateClock();
  setInterval(updateClock, 1000);

  const el = document.getElementById('dashboardDate');
  if (el) el.textContent = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  await checkDbStatus();
  setInterval(checkDbStatus, 30000);

  await loadSharedData();
  loadDashboard();
});

// ── Debounce ──────────────────────────────────────────────────────────────────
function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
