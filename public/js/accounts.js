/* ─── accounts.js — Quản lý Tài khoản & Phê duyệt (Admin) ──────────────── */

async function loadAccountsSection() {
  await loadSharedData();
  loadAccounts();
  if (state.currentUser?.role === 'admin') {
    loadApprovalPanel();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Bảng danh sách tài khoản
// ══════════════════════════════════════════════════════════════════════════════
async function loadAccounts() {
  const container = document.getElementById('accountsTable');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div>Đang tải...</div>';
  try {
    const accounts = await api.accounts.list();
    renderAccountsTable(accounts);
    updateAccountStats(accounts);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Lỗi tải dữ liệu</div><div class="empty-state__sub">${err.message}</div></div>`;
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
    container.innerHTML = '<div class="empty-state"><div class="empty-state__title">Chưa có tài khoản nào</div></div>';
    return;
  }
  const currentUser = state.currentUser || {};
  container.innerHTML = `
  <div class="table-wrap">
    <table>
      <thead><tr>
        <th>Tài khoản</th>
        <th>Username</th>
        <th>Email</th>
        <th>Vai trò</th>
        <th>Trạng thái</th>
        <th>Số lần đăng nhập</th>
        <th>Đăng nhập lần cuối</th>
        <th>Ghi chú Admin</th>
        <th>Hành động</th>
      </tr></thead>
      <tbody>
        ${accounts.map(acc => {
          const isMe      = acc._id === currentUser.id;
          const roleLabel = acc.role === 'admin' ? 'Quản trị viên' : 'Người dùng';
          const roleCls   = acc.role === 'admin' ? 'badge-urgent' : 'badge-active';
          const statusLabel = acc.active ? 'Hoạt động' : 'Vô hiệu';
          const statusCls   = acc.active ? 'badge-active' : 'badge-hold';
          return `<tr class="${!acc.active ? 'row-inactive' : ''}">
            <td>
              <div class="td-name">
                ${mkAvatar(acc.fullName, 'sm')}
                <div>
                  <div>${acc.fullName} ${isMe ? '<span style="font-size:10px;color:var(--accent-3)">(Bạn)</span>' : ''}</div>
                  <div class="td-sub">Tạo: ${formatDate(acc.createdAt)}</div>
                </div>
              </div>
            </td>
            <td><code style="font-size:12px;background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:4px;color:var(--cyan)">${acc.username}</code></td>
            <td><span style="font-size:12px;color:var(--text-secondary)">${acc.email || '--'}</span></td>
            <td><span class="badge ${roleCls}">${roleLabel}</span></td>
            <td><span class="badge ${statusCls}">${statusLabel}</span></td>
            <td style="text-align:center"><span style="font-size:13px;font-weight:600;color:var(--text-primary)">${acc.loginCount || 0}</span></td>
            <td><span style="font-size:11px;color:var(--text-muted)">${acc.lastLogin ? formatDateTime(acc.lastLogin) : '—'}</span></td>
            <td>${acc.adminNote ? `<span class="account-note">${acc.adminNote}</span>` : '<span style="color:var(--text-muted);font-size:11px">—</span>'}</td>
            <td>
              <div style="display:flex;gap:4px;flex-wrap:wrap">
                <button class="btn btn-ghost btn-xs" onclick="editAccount('${acc._id}')">Sửa</button>
                <button class="btn btn-secondary btn-xs" onclick="resetAccountPassword('${acc._id}', '${acc.username}')">Đặt lại MK</button>
                ${!acc.active
                  ? `<button class="btn btn-xs" style="background:rgba(52,211,153,0.1);color:var(--green);border:1px solid rgba(52,211,153,0.3)" onclick="toggleAccountActive('${acc._id}', true)">Kích hoạt</button>`
                  : !isMe && acc.username !== 'admin' ? `<button class="btn btn-xs" style="background:rgba(251,191,36,0.1);color:var(--yellow);border:1px solid rgba(251,191,36,0.3)" onclick="toggleAccountActive('${acc._id}', false)">Vô hiệu hoá</button>` : ''}
                ${!isMe && acc.username !== 'admin' ? `<button class="btn btn-danger btn-xs" onclick="deleteAccount('${acc._id}', '${acc.username}')">Xoá</button>` : ''}
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Bảng phê duyệt (Admin) — Hiển thị task & timelog chờ duyệt
// ══════════════════════════════════════════════════════════════════════════════
async function loadApprovalPanel() {
  const panel = document.getElementById('approvalPanel');
  if (!panel) return;
  panel.innerHTML = '<div class="loading-spinner"><div class="spinner"></div>Đang tải yêu cầu chờ duyệt...</div>';
  try {
    const [pendingTasks, pendingLogs, tlStats] = await Promise.all([
      api.tasks.pendingApproval(),
      api.timelogs.pending(),
      api.timelogs.approvalStats(),
    ]);

    // Cập nhật badge
    const badge = document.getElementById('approvalBadge');
    const total  = (pendingTasks.length + pendingLogs.length);
    if (badge) badge.textContent = total > 0 ? total : '';

    let html = '';

    // ── Pending Tasks ──────────────────────────────────────────────────────
    if (pendingTasks.length > 0) {
      html += `
      <div class="approval-panel" style="margin-bottom:20px">
        <div class="approval-panel__title">
          <span>Công việc chờ duyệt hoàn thành (${pendingTasks.length})</span>
          <span style="font-size:11px;font-weight:400;color:var(--text-muted)">Nhân viên đánh dấu hoàn thành, cần admin xác nhận</span>
        </div>
        ${pendingTasks.map(t => `
        <div class="approval-item">
          ${t.assignee ? mkAvatar(t.assignee.fullName, 'sm') : '<div class="avatar avatar-sm" style="background:#475569">?</div>'}
          <div class="approval-item__info">
            <div class="approval-item__name">${t.name}</div>
            <div class="approval-item__sub">
              ${t.project?.name || ''} &middot;
              ${t.assignee?.fullName || 'Chưa phân công'} &middot;
              Gửi duyệt: ${formatDateTime(t.updatedAt)}
              ${t.approvalNote ? ` &middot; <em>"${t.approvalNote}"</em>` : ''}
            </div>
          </div>
          ${priorityBadge(t.priority)}
          <div class="approval-item__actions">
            <button class="btn btn-xs" style="background:rgba(52,211,153,0.15);color:var(--green);border:1px solid rgba(52,211,153,0.3)"
              onclick="approveTask('${t._id}','approved')">Duyệt</button>
            <button class="btn btn-xs" style="background:rgba(248,113,113,0.15);color:var(--red);border:1px solid rgba(248,113,113,0.3)"
              onclick="approveTask('${t._id}','rejected')">Từ chối</button>
          </div>
        </div>`).join('')}
      </div>`;
    }

    // ── Pending TimeLogs ───────────────────────────────────────────────────
    const statsHtml = `
    <div style="display:flex;gap:12px;margin-bottom:14px;font-size:12px">
      <span style="color:var(--yellow)">Chờ duyệt: <strong>${tlStats.pending}</strong></span>
      <span style="color:var(--green)">Đã duyệt: <strong>${tlStats.approved}</strong></span>
      <span style="color:var(--red)">Từ chối: <strong>${tlStats.rejected}</strong></span>
    </div>`;

    if (pendingLogs.length > 0) {
      html += `
      <div class="approval-panel">
        <div class="approval-panel__title">
          <span>Giờ làm chờ duyệt (${pendingLogs.length})</span>
          <span style="font-size:11px;font-weight:400;color:var(--text-muted)">Nhân viên ghi nhận, cần admin xác nhận</span>
        </div>
        ${statsHtml}
        ${pendingLogs.map(l => `
        <div class="approval-item">
          ${mkAvatar(l.staff?.fullName || '?', 'sm')}
          <div class="approval-item__info">
            <div class="approval-item__name">${l.staff?.fullName || '--'} — <span style="color:var(--accent-3)">${l.hoursWorked}h</span></div>
            <div class="approval-item__sub">
              ${l.task?.name || ''} / ${l.task?.project?.name || ''} &middot;
              ${formatDate(l.date)}
              ${l.notes ? ` &middot; <em>"${l.notes}"</em>` : ''}
            </div>
          </div>
          ${l.qualityRating ? `<span class="badge badge-active" style="flex-shrink:0">★ ${l.qualityRating}/5</span>` : ''}
          <div class="approval-item__actions">
            <button class="btn btn-xs" style="background:rgba(52,211,153,0.15);color:var(--green);border:1px solid rgba(52,211,153,0.3)"
              onclick="approveTimelog('${l._id}','approved')">Duyệt</button>
            <button class="btn btn-xs" style="background:rgba(248,113,113,0.15);color:var(--red);border:1px solid rgba(248,113,113,0.3)"
              onclick="approveTimelog('${l._id}','rejected')">Từ chối</button>
          </div>
        </div>`).join('')}
      </div>`;
    }

    if (!pendingTasks.length && !pendingLogs.length) {
      html = `<div class="empty-state" style="padding:24px">
        <div class="empty-state__title" style="color:var(--green)">Không có yêu cầu chờ duyệt</div>
        <div class="empty-state__sub">Tất cả công việc và giờ làm đã được xử lý</div>
      </div>`;
    }

    panel.innerHTML = html;
  } catch (err) {
    panel.innerHTML = `<div class="empty-state"><div class="empty-state__sub">${err.message}</div></div>`;
  }
}

// ── Duyệt task ────────────────────────────────────────────────────────────────
async function approveTask(id, action) {
  if (action === 'rejected') {
    modal.open({
      title: 'Lý do từ chối',
      body: `<div class="form-group"><label class="form-label">Ghi chú lý do từ chối</label><textarea id="f-reject-note" class="form-control" placeholder="Nêu lý do..." style="height:80px"></textarea></div>`,
      confirmText: 'Xác nhận từ chối',
      onConfirm: async () => {
        const note = document.getElementById('f-reject-note').value;
        try {
          modal.setLoading(true);
          const u = state.currentUser;
          await api.tasks.approve(id, { action: 'rejected', note, approverId: u?.id });
          modal.close(); showToast('Đã từ chối yêu cầu'); loadApprovalPanel(); loadTasks?.();
        } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
        finally { modal.setLoading(false); }
      },
    });
    return;
  }
  try {
    const u = state.currentUser;
    await api.tasks.approve(id, { action: 'approved', approverId: u?.id });
    showToast('Đã duyệt công việc hoàn thành');
    loadApprovalPanel(); loadTasks?.();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

// ── Duyệt timelog ─────────────────────────────────────────────────────────────
async function approveTimelog(id, action) {
  if (action === 'rejected') {
    modal.open({
      title: 'Từ chối giờ làm',
      body: `<div class="form-group"><label class="form-label">Lý do từ chối</label><textarea id="f-reject-tl" class="form-control" placeholder="Nhập lý do..." style="height:80px"></textarea></div>`,
      confirmText: 'Từ chối',
      onConfirm: async () => {
        const reason = document.getElementById('f-reject-tl').value;
        try {
          modal.setLoading(true);
          await api.timelogs.approve(id, { action: 'rejected', reason });
          modal.close(); showToast('Đã từ chối giờ làm'); loadApprovalPanel();
        } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
        finally { modal.setLoading(false); }
      },
    });
    return;
  }
  try {
    await api.timelogs.approve(id, { action: 'approved' });
    showToast('Đã duyệt giờ làm'); loadApprovalPanel();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════════════════════
// Password Strength Checker
// ══════════════════════════════════════════════════════════════════════════════
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
  const label    = { weak: 'Yếu', fair: 'Trung bình', good: 'Khá', strong: 'Mạnh' }[strength];
  const color    = { weak: 'var(--red)', fair: 'var(--yellow)', good: 'var(--cyan)', strong: 'var(--green)' }[strength];
  container.innerHTML = `
  <div class="pw-strength">
    <div class="pw-strength__bar">
      ${[1,2,3,4].map(i => `<div class="pw-strength__seg ${i <= score ? strength : ''}"></div>`).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <div class="pw-strength__checks">
        <span class="pw-check ${checks.length ? 'pass' : 'fail'}">8+ ký tự</span>
        <span class="pw-check ${checks.upper  ? 'pass' : 'fail'}">Chữ hoa</span>
        <span class="pw-check ${checks.number ? 'pass' : 'fail'}">Số</span>
        <span class="pw-check ${checks.special? 'pass' : 'fail'}">Ký tự đặc biệt</span>
      </div>
      ${pw ? `<span style="font-size:11px;color:${color};font-weight:600">${label}</span>` : ''}
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Form Tạo / Sửa Tài khoản (với password strength)
// ══════════════════════════════════════════════════════════════════════════════
function getAccountFormHtml(acc = {}, isEdit = false) {
  const userOptions = (state.users || []).map(u =>
    `<option value="${u._id}" ${acc.linkedUser?._id === u._id ? 'selected' : ''}>${u.fullName}</option>`
  ).join('');
  return `
  <div class="form-row">
    <div class="form-group">
      <label class="form-label">Họ tên *</label>
      <input id="f-acc-name" class="form-control" value="${acc.fullName || ''}" placeholder="Nguyễn Văn A">
    </div>
    <div class="form-group">
      <label class="form-label">Email</label>
      <input id="f-acc-email" class="form-control" type="email" value="${acc.email || ''}">
    </div>
  </div>
  <div class="form-row">
    <div class="form-group">
      <label class="form-label">Username * ${isEdit ? '<span style="font-size:10px;color:var(--text-muted)">(không thể đổi)</span>' : '<span style="font-size:10px;color:var(--text-muted)">(chỉ chữ thường, số, gạch dưới)</span>'}</label>
      <input id="f-acc-username" class="form-control" value="${acc.username || ''}" placeholder="ten_dang_nhap" ${isEdit ? 'readonly style="opacity:0.6"' : ''}>
    </div>
    ${!isEdit ? `
    <div class="form-group">
      <label class="form-label">Mật khẩu *</label>
      <input id="f-acc-password" class="form-control" type="password" placeholder="Tối thiểu 8 ký tự..."
        oninput="renderPwStrength(this.value,'pwStrengthBox')">
      <div id="pwStrengthBox"></div>
    </div>` : '<div></div>'}
  </div>
  <div class="form-row">
    <div class="form-group">
      <label class="form-label">Vai trò</label>
      <select id="f-acc-role" class="form-control">
        <option value="user" ${acc.role === 'user' || !acc.role ? 'selected' : ''}>Người dùng</option>
        <option value="admin" ${acc.role === 'admin' ? 'selected' : ''}>Quản trị viên</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Trạng thái</label>
      <select id="f-acc-active" class="form-control">
        <option value="true" ${acc.active !== false ? 'selected' : ''}>Hoạt động</option>
        <option value="false" ${acc.active === false ? 'selected' : ''}>Vô hiệu hoá</option>
      </select>
    </div>
  </div>
  <div class="form-group">
    <label class="form-label">Liên kết với nhân viên (tuỳ chọn)</label>
    <select id="f-acc-linked" class="form-control">
      <option value="">-- Không liên kết --</option>
      ${userOptions}
    </select>
  </div>
  <div class="form-group">
    <label class="form-label">Ghi chú nội bộ (chỉ admin thấy)</label>
    <input id="f-acc-note" class="form-control" value="${acc.adminNote || ''}" placeholder="Ghi chú nội bộ...">
  </div>
  <div style="padding:10px 12px;background:rgba(99,102,241,0.08);border-radius:8px;font-size:11.5px;color:var(--text-secondary)">
    <strong style="color:var(--accent-3)">Quản trị viên:</strong> Toàn quyền truy cập, quản lý tài khoản, duyệt công việc &amp; giờ làm.<br>
    <strong style="color:var(--cyan)">Người dùng:</strong> Xem và thao tác dữ liệu, ghi nhận giờ làm, gửi yêu cầu duyệt.
  </div>`;
}

// Yêu cầu mật khẩu hợp lệ
function validatePw(pw) {
  if (!pw || pw.length < 8)             return 'Mật khẩu phải có ít nhất 8 ký tự';
  if (!/[A-Z]/.test(pw))               return 'Cần ít nhất 1 chữ hoa (A-Z)';
  if (!/[0-9]/.test(pw))               return 'Cần ít nhất 1 chữ số (0-9)';
  if (!/[!@#$%^&*()\-_,.?":{}|<>]/.test(pw)) return 'Cần ít nhất 1 ký tự đặc biệt (!@#...)';
  return null;
}

document.getElementById('btnAddAccount')?.addEventListener('click', () => {
  modal.open({
    title: 'Tạo tài khoản mới', body: getAccountFormHtml({}, false), confirmText: 'Tạo tài khoản', wide: true,
    onConfirm: async () => {
      const pw = document.getElementById('f-acc-password')?.value || '';
      const pwErr = validatePw(pw);
      if (pwErr) return showToast(pwErr, 'error');
      const un = document.getElementById('f-acc-username').value.trim();
      if (!/^[a-z0-9_]+$/.test(un)) return showToast('Username chỉ dùng chữ thường, số và dấu gạch dưới', 'error');
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
      if (!body.fullName) return showToast('Vui lòng nhập họ tên', 'error');
      if (!body.username) return showToast('Vui lòng nhập username', 'error');
      try {
        modal.setLoading(true);
        await api.accounts.create(body);
        modal.close(); showToast('Đã tạo tài khoản thành công'); loadAccounts();
      } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
});

async function editAccount(id) {
  try {
    const accounts = await api.accounts.list();
    const acc = accounts.find(a => a._id === id);
    if (!acc) return showToast('Không tìm thấy tài khoản', 'error');
    modal.open({
      title: 'Cập nhật tài khoản', body: getAccountFormHtml(acc, true), confirmText: 'Cập nhật', wide: true,
      onConfirm: async () => {
        const body = {
          fullName:   document.getElementById('f-acc-name').value.trim(),
          email:      document.getElementById('f-acc-email').value.trim(),
          role:       document.getElementById('f-acc-role').value,
          active:     document.getElementById('f-acc-active').value === 'true',
          linkedUser: document.getElementById('f-acc-linked').value || null,
          adminNote:  document.getElementById('f-acc-note').value.trim(),
        };
        if (!body.fullName) return showToast('Vui lòng nhập họ tên', 'error');
        try {
          modal.setLoading(true);
          await api.accounts.update(id, body);
          modal.close(); showToast('Đã cập nhật tài khoản'); loadAccounts();
        } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
        finally { modal.setLoading(false); }
      },
    });
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

async function toggleAccountActive(id, activate) {
  try {
    await api.accounts.update(id, { active: activate });
    showToast(activate ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hoá tài khoản');
    loadAccounts();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

function resetAccountPassword(id, username) {
  modal.open({
    title: `Đặt lại mật khẩu — ${username}`,
    body: `
    <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">Mật khẩu mới phải đáp ứng yêu cầu bảo mật.</p>
    <div class="form-group">
      <label class="form-label">Mật khẩu mới *</label>
      <input id="f-reset-pw" class="form-control" type="password" placeholder="Tối thiểu 8 ký tự..."
        oninput="renderPwStrength(this.value,'resetPwStrength')">
      <div id="resetPwStrength"></div>
    </div>
    <div class="form-group">
      <label class="form-label">Nhập lại mật khẩu</label>
      <input id="f-reset-pw2" class="form-control" type="password" placeholder="Nhập lại mật khẩu mới">
    </div>`,
    confirmText: 'Đặt lại mật khẩu',
    onConfirm: async () => {
      const pw  = document.getElementById('f-reset-pw').value;
      const pw2 = document.getElementById('f-reset-pw2').value;
      const err = validatePw(pw);
      if (err)      return showToast(err, 'error');
      if (pw !== pw2) return showToast('Mật khẩu nhập lại không khớp', 'error');
      try {
        modal.setLoading(true);
        await api.accounts.resetPassword(id, { newPassword: pw });
        modal.close(); showToast('Đã đặt lại mật khẩu thành công');
      } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
}

function deleteAccount(id, username) {
  modal.open({
    title: 'Xác nhận xoá tài khoản',
    body: `<p style="color:var(--text-secondary)">Bạn có chắc muốn xoá tài khoản <strong style="color:var(--text-primary)">${username}</strong>?<br>Hành động này không thể hoàn tác.</p>`,
    confirmText: 'Xoá tài khoản',
    onConfirm: async () => {
      try {
        modal.setLoading(true);
        await api.accounts.remove(id);
        modal.close(); showToast('Đã xoá tài khoản'); loadAccounts();
      } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
}

// ── Đổi mật khẩu của chính mình ──────────────────────────────────────────────
function showChangePasswordModal() {
  modal.open({
    title: 'Đổi mật khẩu',
    body: `
    <div class="form-group"><label class="form-label">Mật khẩu hiện tại</label><input id="f-cp-old" class="form-control" type="password" placeholder="Mật khẩu hiện tại"></div>
    <div class="form-group">
      <label class="form-label">Mật khẩu mới</label>
      <input id="f-cp-new" class="form-control" type="password" placeholder="Tối thiểu 8 ký tự, 1 chữ hoa, 1 số, 1 ký tự đặc biệt"
        oninput="renderPwStrength(this.value,'cpPwStrength')">
      <div id="cpPwStrength"></div>
    </div>
    <div class="form-group"><label class="form-label">Nhập lại mật khẩu mới</label><input id="f-cp-new2" class="form-control" type="password" placeholder="Nhập lại"></div>`,
    confirmText: 'Đổi mật khẩu',
    onConfirm: async () => {
      const oldPw  = document.getElementById('f-cp-old').value;
      const newPw  = document.getElementById('f-cp-new').value;
      const newPw2 = document.getElementById('f-cp-new2').value;
      if (!oldPw) return showToast('Vui lòng nhập mật khẩu hiện tại', 'error');
      const err = validatePw(newPw);
      if (err)            return showToast(err, 'error');
      if (newPw !== newPw2) return showToast('Mật khẩu nhập lại không khớp', 'error');
      try {
        modal.setLoading(true);
        await api.auth.changePassword({ currentPassword: oldPw, newPassword: newPw });
        modal.close(); showToast('Đổi mật khẩu thành công!');
      } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
}
