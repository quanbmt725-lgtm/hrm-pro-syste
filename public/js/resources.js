/* ─── resources.js — Nhân sự & AI MCDM (tiếng Việt) ────────────────────── */
let allUsers = [];

async function loadResourcesSection() {
  await loadSharedData();
  loadStaff();
}

async function loadStaff() {
  const grid = document.getElementById('staffGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1"><div class="spinner"></div>Đang tải...</div>';
  try {
    const dept = document.getElementById('filterUserDept')?.value || '';
    const params = {};
    if (dept) params.department = dept;
    let users = await api.users.list(params);

    const search = document.getElementById('searchUser')?.value?.toLowerCase() || '';
    if (search) users = users.filter(u => u.fullName.toLowerCase().includes(search) || (u.position || '').toLowerCase().includes(search));

    const wlFilter = document.getElementById('filterWorkload')?.value || '';
    if (wlFilter === 'low')    users = users.filter(u => u.workloadPercent <= 40);
    if (wlFilter === 'medium') users = users.filter(u => u.workloadPercent > 40 && u.workloadPercent <= 70);
    if (wlFilter === 'high')   users = users.filter(u => u.workloadPercent > 70);

    allUsers = users;
    updateResourceSummary(users);
    renderStaffGrid(users);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__title">Lỗi tải dữ liệu</div></div>`;
    showToast('Lỗi: ' + err.message, 'error');
  }
}

function updateResourceSummary(users) {
  const available = users.filter(u => u.workloadPercent <= 70).length;
  const busy      = users.filter(u => u.workloadPercent > 70 && u.workloadPercent <= 85).length;
  const overload  = users.filter(u => u.workloadPercent > 85).length;
  document.getElementById('sumTotal').textContent     = users.length;
  document.getElementById('sumAvailable').textContent = available;
  document.getElementById('sumBusy').textContent      = busy;
  document.getElementById('sumOverload').textContent  = overload;
}

function renderStaffGrid(users) {
  const grid = document.getElementById('staffGrid');
  if (!users.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__title">Không tìm thấy nhân viên</div></div>';
    return;
  }
  grid.innerHTML = users.map(u => {
    const wl     = workloadStatus(u.workloadPercent);
    const dColor = u.department?.color || '#6366f1';
    const wlBarBg = u.workloadPercent > 85 ? 'var(--red)' : u.workloadPercent > 70 ? 'var(--yellow)' : 'var(--gradient-primary)';
    return `
    <div class="staff-card">
      <div class="staff-card__header">
        ${mkAvatar(u.fullName)}
        <div class="staff-card__info">
          <div class="staff-card__name">${u.fullName}</div>
          <div class="staff-card__pos">${u.position || '--'}</div>
        </div>
        <span class="staff-card__dept" style="background:${dColor}22;color:${dColor};border:1px solid ${dColor}44">${u.department?.name?.split(' ')[0] || '--'}</span>
      </div>
      <div class="staff-card__workload">
        <div class="workload-label">
          <span>Khối lượng công việc</span>
          <span style="color:${wl.color};font-weight:700">${u.workloadPercent}% — ${wl.label}</span>
        </div>
        <div class="progress-bar"><div class="progress-bar__fill" style="width:${u.workloadPercent}%;background:${wlBarBg}"></div></div>
      </div>
      <div class="staff-card__skills">
        <div class="skills-wrap">
          ${(u.skills || []).slice(0, 5).map(s => `<span class="skill-tag">${s}</span>`).join('')}
          ${u.skills?.length > 5 ? `<span style="font-size:10px;color:var(--text-muted)">+${u.skills.length - 5} kỹ năng</span>` : ''}
        </div>
      </div>
      <div class="staff-card__score">
        <span style="font-size:11px;color:var(--text-secondary)">Hiệu suất</span>
        <span class="staff-card__score-val">${u.performanceScore.toFixed(1)}<span style="font-size:11px;font-weight:400;-webkit-text-fill-color:var(--text-muted)">/10</span></span>
      </div>
      <div style="display:flex;gap:4px;margin-top:12px">
        <button class="btn btn-ghost btn-xs" onclick="editUser('${u._id}')">Sửa</button>
        <button class="btn btn-secondary btn-xs" onclick="showAISuggestForUser('${u._id}')">AI Phân công</button>
        <button class="btn btn-danger btn-xs" onclick="deleteUser('${u._id}','${u.fullName.replace(/'/g,"\\'")}')">Xoá</button>
      </div>
    </div>`;
  }).join('');
}

document.getElementById('searchUser')?.addEventListener('input', debounce(loadStaff, 300));
document.getElementById('filterUserDept')?.addEventListener('change', loadStaff);
document.getElementById('filterWorkload')?.addEventListener('change', loadStaff);

// ══════════════════════════════════════════════════════════════════════════════
// Thêm / Sửa nhân viên
// ══════════════════════════════════════════════════════════════════════════════
function getUserFormHtml(user = {}) {
  const deptOptions = state.departments.map(d =>
    `<option value="${d._id}" ${(user.department?._id || user.department) === d._id ? 'selected' : ''}>${d.name}</option>`
  ).join('');
  const skillsStr = (user.skills || []).join(', ');
  return `
  <div class="form-row">
    <div class="form-group"><label class="form-label">Họ tên *</label><input id="f-u-name" class="form-control" value="${user.fullName || ''}" placeholder="Nguyễn Văn A"></div>
    <div class="form-group"><label class="form-label">Email</label><input id="f-u-email" class="form-control" value="${user.email || ''}" type="email"></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label class="form-label">Phòng ban</label><select id="f-u-dept" class="form-control"><option value="">-- Chọn --</option>${deptOptions}</select></div>
    <div class="form-group"><label class="form-label">Vị trí / Chức vụ</label><input id="f-u-pos" class="form-control" value="${user.position || ''}" placeholder="Senior Developer"></div>
  </div>
  <div class="form-group"><label class="form-label">Kỹ năng (cách nhau bởi dấu phẩy)</label><input id="f-u-skills" class="form-control" value="${skillsStr}" placeholder="Python, React, Docker..."></div>
  <div class="form-row">
    <div class="form-group"><label class="form-label">Điểm hiệu suất (0–10)</label><input id="f-u-perf" type="number" step="0.1" min="0" max="10" class="form-control" value="${user.performanceScore || 7.0}"></div>
    <div class="form-group"><label class="form-label">Workload hiện tại (%)</label><input id="f-u-workload" type="number" min="0" max="100" class="form-control" value="${user.workloadPercent || 0}"></div>
  </div>`;
}

document.getElementById('btnAddUser')?.addEventListener('click', () => {
  modal.open({
    title: 'Thêm nhân viên mới', body: getUserFormHtml(), confirmText: 'Thêm',
    onConfirm: async () => {
      const body = {
        fullName:        document.getElementById('f-u-name').value.trim(),
        email:           document.getElementById('f-u-email').value.trim(),
        department:      document.getElementById('f-u-dept').value || undefined,
        position:        document.getElementById('f-u-pos').value.trim(),
        skills:          document.getElementById('f-u-skills').value.split(',').map(s => s.trim()).filter(Boolean),
        performanceScore: parseFloat(document.getElementById('f-u-perf').value) || 7,
        workloadPercent:  parseInt(document.getElementById('f-u-workload').value) || 0,
      };
      if (!body.fullName) return showToast('Vui lòng nhập họ tên', 'error');
      try {
        modal.setLoading(true);
        await api.users.create(body);
        modal.close(); showToast('Đã thêm nhân viên');
        await loadSharedData(); loadStaff();
      } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
});

async function editUser(id) {
  try {
    const user = await api.users.get(id);
    modal.open({
      title: 'Cập nhật nhân viên', body: getUserFormHtml(user), confirmText: 'Cập nhật',
      onConfirm: async () => {
        const body = {
          fullName:        document.getElementById('f-u-name').value.trim(),
          email:           document.getElementById('f-u-email').value.trim(),
          department:      document.getElementById('f-u-dept').value || undefined,
          position:        document.getElementById('f-u-pos').value.trim(),
          skills:          document.getElementById('f-u-skills').value.split(',').map(s => s.trim()).filter(Boolean),
          performanceScore: parseFloat(document.getElementById('f-u-perf').value) || 7,
          workloadPercent:  parseInt(document.getElementById('f-u-workload').value) || 0,
        };
        if (!body.fullName) return showToast('Vui lòng nhập họ tên', 'error');
        try {
          modal.setLoading(true);
          await api.users.update(id, body);
          modal.close(); showToast('Đã cập nhật nhân viên');
          await loadSharedData(); loadStaff();
        } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
        finally { modal.setLoading(false); }
      },
    });
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

async function deleteUser(id, name) {
  modal.open({
    title: 'Xác nhận xoá',
    body: `<p style="color:var(--text-secondary)">Bạn có chắc muốn xoá nhân viên <strong style="color:var(--text-primary)">${name}</strong>?</p>`,
    confirmText: 'Xoá',
    onConfirm: async () => {
      try {
        modal.setLoading(true);
        await api.users.remove(id);
        modal.close(); showToast('Đã xoá nhân viên');
        await loadSharedData(); loadStaff();
      } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// AI MCDM Gợi ý phân công
// ══════════════════════════════════════════════════════════════════════════════
document.getElementById('btnAISuggest')?.addEventListener('click', () => showAISuggestModal());

function showAISuggestForUser(userId) {
  const user = allUsers.find(u => u._id === userId);
  showAISuggestModal(user?.skills?.join(', ') || '');
}

async function showAISuggestModal(prefillSkills = '') {
  modal.open({
    title: 'AI Gợi ý Phân công Tối ưu', wide: true,
    body: `
    <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:600;color:var(--accent-3);margin-bottom:6px">MCDM — Ra quyết định đa tiêu chí</div>
      <div style="font-size:11.5px;color:var(--text-secondary);line-height:1.8">
        Hệ thống tính điểm cho từng nhân viên theo 3 tiêu chí:<br>
        <span style="color:var(--cyan)">Kỹ năng khớp (40%)</span> +
        <span style="color:var(--green)">Năng lực còn lại (35%)</span> +
        <span style="color:var(--accent-3)">Hiệu suất lịch sử (25%)</span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Kỹ năng yêu cầu của công việc (cách nhau bởi dấu phẩy)</label>
      <input id="ai-skills-input" class="form-control" value="${prefillSkills}" placeholder="Ví dụ: Python, React, Docker, MongoDB">
    </div>
    <div id="ai-results">
      <div style="text-align:center;color:var(--text-muted);padding:24px;font-size:13px">Nhập kỹ năng và nhấn "Tìm ứng viên" để xem gợi ý AI</div>
    </div>`,
    confirmText: 'Tìm ứng viên',
    onConfirm: async () => {
      const skills    = document.getElementById('ai-skills-input').value;
      const resultsEl = document.getElementById('ai-results');
      resultsEl.innerHTML = '<div class="loading-spinner"><div class="spinner"></div>Đang tính toán...</div>';
      try {
        const data = await api.tasks.aiSuggest({ skills });
        renderAISuggestions(data.suggestions, data.requiredSkills, resultsEl);
        document.getElementById('modalConfirm').textContent = 'Tìm lại';
      } catch (err) {
        resultsEl.innerHTML = `<div class="empty-state"><div class="empty-state__title">Lỗi tính toán</div><div class="empty-state__sub">${err.message}</div></div>`;
      }
    },
  });
}

function renderAISuggestions(suggestions, requiredSkills, container) {
  if (!suggestions || !suggestions.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state__title">Không tìm được ứng viên phù hợp</div></div>';
    return;
  }
  const rankLabels = ['#1', '#2', '#3'];
  container.innerHTML = `
  <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">
    Kỹ năng yêu cầu: ${requiredSkills.length ? requiredSkills.map(s => `<span class="skill-tag">${s}</span>`).join(' ') : '<em>Không có (ưu tiên workload + hiệu suất)</em>'}
  </div>
  <div class="ai-result">
    ${suggestions.map((s, i) => {
      const u = s.user, b = s.breakdown;
      const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : 'rank-3';
      return `
      <div class="ai-card ${rankClass}">
        <div class="ai-card__header">
          <div class="ai-rank ${rankClass}">${rankLabels[i]}</div>
          ${mkAvatar(u.fullName)}
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:700">${u.fullName}</div>
            <div style="font-size:11px;color:var(--text-secondary)">${u.position} &middot; ${u.department?.name || ''}</div>
          </div>
          <div class="ai-total-score">${(s.totalScore * 100).toFixed(0)}<span style="font-size:12px;font-weight:400;-webkit-text-fill-color:var(--text-muted)">/100</span></div>
        </div>
        <div class="ai-score-bar">
          <div class="ai-score-bar__item">
            <div class="ai-score-bar__val skill">${(b.skillMatch * 100).toFixed(0)}%</div>
            <div class="ai-score-bar__label">Kỹ năng khớp</div>
            <div class="progress-bar progress-bar--sm" style="margin-top:4px"><div class="progress-bar__fill" style="width:${b.skillMatch*100}%;background:var(--cyan)"></div></div>
          </div>
          <div class="ai-score-bar__item">
            <div class="ai-score-bar__val workload">${(b.workloadFactor * 100).toFixed(0)}%</div>
            <div class="ai-score-bar__label">Năng lực còn lại</div>
            <div class="progress-bar progress-bar--sm" style="margin-top:4px"><div class="progress-bar__fill" style="width:${b.workloadFactor*100}%;background:var(--green)"></div></div>
          </div>
          <div class="ai-score-bar__item">
            <div class="ai-score-bar__val perf">${b.performanceScore.toFixed(1)}/10</div>
            <div class="ai-score-bar__label">Hiệu suất lịch sử</div>
            <div class="progress-bar progress-bar--sm" style="margin-top:4px"><div class="progress-bar__fill" style="width:${b.performanceScore*10}%;background:var(--accent-2)"></div></div>
          </div>
        </div>
        <div class="ai-explanation">
          ${s.explanations.map(e => `<p>${e}</p>`).join('')}
          ${b.matchedSkills.length ? `<p>Kỹ năng khớp: ${b.matchedSkills.map(sk => `<span class="skill-tag matched">${sk}</span>`).join(' ')}</p>` : ''}
          ${b.unmatchedSkills.length ? `<p>Chưa có: ${b.unmatchedSkills.map(sk => `<span class="skill-tag unmatched">${sk}</span>`).join(' ')}</p>` : ''}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
          <span style="font-size:11px;color:var(--text-muted)">Workload hiện tại: <strong style="color:var(--text-primary)">${u.workloadPercent}%</strong></span>
          <span style="font-size:11px;color:var(--text-muted)">
            Kỹ năng <strong style="color:var(--cyan)">+${(b.scoreContributions.skill*100).toFixed(0)}</strong> &middot;
            Workload <strong style="color:var(--green)">+${(b.scoreContributions.workload*100).toFixed(0)}</strong> &middot;
            Hiệu suất <strong style="color:var(--accent-3)">+${(b.scoreContributions.performance*100).toFixed(0)}</strong>
          </span>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
