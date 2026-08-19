/* ─── projects.js — Dự án & Kanban tiếng Việt ───────────────────────────── */
let allTasks = [], allProjects = [];

// ══════════════════════════════════════════════════════════════════════════════
async function loadProjectsSection() {
  await loadSharedData();
  loadProjects();
}

async function loadProjects() {
  const container = document.getElementById('projectList');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div>Đang tải...</div>';
  try {
    const search = document.getElementById('searchProject')?.value?.toLowerCase() || '';
    const status = document.getElementById('filterProjectStatus')?.value || '';
    const dept   = document.getElementById('filterProjectDept')?.value   || '';
    const params = {};
    if (status) params.status = status;
    if (dept)   params.department = dept;
    let projects = await api.projects.list(params);
    if (search) projects = projects.filter(p => p.name.toLowerCase().includes(search));
    allProjects = projects;
    renderProjectList(projects);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Lỗi tải dữ liệu</div><div class="empty-state__sub">${err.message}</div></div>`;
  }
}

function renderProjectList(projects) {
  const container = document.getElementById('projectList');
  if (!projects.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state__title">Chưa có dự án nào</div><div class="empty-state__sub">Nhấn "Tạo dự án mới" để bắt đầu</div></div>';
    return;
  }
  container.innerHTML = projects.map(p => {
    const dColor = p.department?.color || '#6366f1';
    const dead   = p.deadline ? formatDate(p.deadline) : '--';
    const overdue = p.status !== 'Completed' && isOverdue(p.deadline);
    return `
    <div class="project-item" style="cursor:pointer;" onclick="showProjectDetail('${p._id}')">
      <div style="width:4px;height:60px;background:${dColor};border-radius:2px;flex-shrink:0"></div>
      <div class="project-item__info">
        <div class="project-item__name">${p.name}</div>
        <div class="project-item__desc">${p.description || 'Chưa có mô tả'}</div>
        <div class="project-item__meta">
          ${statusBadge(p.status)}
          <span style="font-size:11px;color:var(--text-muted)">Phòng ban: ${p.department?.name || '--'}</span>
          <span style="font-size:11px;color:${overdue ? 'var(--red)' : 'var(--text-muted)'}">Hạn: ${dead}</span>
        </div>
      </div>
      <div class="project-item__progress" style="min-width:140px">
        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;display:flex;justify-content:space-between">
          <span>Tiến độ</span><span style="font-weight:700;color:var(--text-primary)">${p.progress}%</span>
        </div>
        <div class="progress-bar progress-bar--lg">
          <div class="progress-bar__fill" style="width:${p.progress}%"></div>
        </div>
      </div>
      <div class="project-item__actions" onclick="event.stopPropagation()">
${state.currentUser?.role === 'admin' ? `
        <button class="btn btn-ghost btn-xs" onclick="editProject('${p._id}')">Sửa</button>
        <button class="btn btn-danger btn-xs" onclick="deleteProject('${p._id}', '${p.name.replace(/'/g,"\\'")}')">Xoá</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

function getProjectFormHtml(proj = {}) {
  const deptOptions = state.departments.map(d =>
    `<option value="${d._id}" ${(proj.department?._id || proj.department) === d._id ? 'selected' : ''}>${d.name}</option>`
  ).join('');
  return `
  <div class="form-group"><label class="form-label">Tên dự án *</label><input id="f-proj-name" class="form-control" value="${proj.name || ''}" placeholder="Nhập tên dự án"></div>
  <div class="form-group"><label class="form-label">Mô tả</label><textarea id="f-proj-desc" class="form-control">${proj.description || ''}</textarea></div>
  <div class="form-row">
    <div class="form-group"><label class="form-label">Phòng ban</label><select id="f-proj-dept" class="form-control"><option value="">-- Chọn --</option>${deptOptions}</select></div>
    <div class="form-group"><label class="form-label">Trạng thái</label><select id="f-proj-status" class="form-control">
      <option value="Planning" ${proj.status==='Planning'?'selected':''}>Lên kế hoạch</option>
      <option value="Active" ${proj.status==='Active'?'selected':''}>Đang hoạt động</option>
      <option value="On Hold" ${proj.status==='On Hold'?'selected':''}>Tạm dừng</option>
      <option value="Completed" ${proj.status==='Completed'?'selected':''}>Hoàn thành</option>
    </select></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label class="form-label">Ngày bắt đầu</label><input id="f-proj-start" type="date" class="form-control" value="${proj.startDate ? proj.startDate.slice(0,10) : ''}"></div>
    <div class="form-group"><label class="form-label">Hạn hoàn thành</label><input id="f-proj-deadline" type="date" class="form-control" value="${proj.deadline ? proj.deadline.slice(0,10) : ''}"></div>
  </div>
  <div class="form-group">
    <label class="form-label" id="lbl-progress">Tiến độ (%) — ${proj.progress || 0}%</label>
    <input id="f-proj-progress" type="range" min="0" max="100" value="${proj.progress || 0}" class="form-control"
      oninput="document.getElementById('lbl-progress').textContent='Tiến độ (%) — '+this.value+'%'" style="padding:4px">
  </div>`;
}

document.getElementById('btnAddProject')?.addEventListener('click', () => {
  modal.open({
    title: 'Tạo dự án mới', body: getProjectFormHtml(), confirmText: 'Tạo dự án',
    onConfirm: async () => {
      const body = {
        name:        document.getElementById('f-proj-name').value.trim(),
        description: document.getElementById('f-proj-desc').value.trim(),
        department:  document.getElementById('f-proj-dept').value || undefined,
        status:      document.getElementById('f-proj-status').value,
        startDate:   document.getElementById('f-proj-start').value || undefined,
        deadline:    document.getElementById('f-proj-deadline').value || undefined,
        progress:    parseInt(document.getElementById('f-proj-progress').value),
      };
      if (!body.name) return showToast('Vui lòng nhập tên dự án', 'error');
      try {
        modal.setLoading(true);
        await api.projects.create(body);
        modal.close(); showToast('Đã tạo dự án thành công');
        await loadSharedData(); loadProjects();
      } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
});

async function editProject(id) {
  try {
    const proj = await api.projects.get(id);
    modal.open({
      title: 'Cập nhật dự án', body: getProjectFormHtml(proj), confirmText: 'Cập nhật',
      onConfirm: async () => {
        const body = {
          name:        document.getElementById('f-proj-name').value.trim(),
          description: document.getElementById('f-proj-desc').value.trim(),
          department:  document.getElementById('f-proj-dept').value || undefined,
          status:      document.getElementById('f-proj-status').value,
          startDate:   document.getElementById('f-proj-start').value || undefined,
          deadline:    document.getElementById('f-proj-deadline').value || undefined,
          progress:    parseInt(document.getElementById('f-proj-progress').value),
        };
        if (!body.name) return showToast('Vui lòng nhập tên dự án', 'error');
        try {
          modal.setLoading(true);
          await api.projects.update(id, body);
          modal.close(); showToast('Đã cập nhật dự án');
          await loadSharedData(); loadProjects();
        } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
        finally { modal.setLoading(false); }
      },
    });
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

async function deleteProject(id, name) {
  modal.open({
    title: 'Xác nhận xoá dự án',
    body: `<p style="color:var(--text-secondary);font-size:14px">Bạn có chắc muốn xoá dự án <strong style="color:var(--text-primary)">${name}</strong>?<br>Tất cả công việc liên quan cũng sẽ bị xoá.</p>`,
    confirmText: 'Xoá',
    onConfirm: async () => {
      try {
        modal.setLoading(true);
        await api.projects.remove(id);
        modal.close(); showToast('Đã xoá dự án');
        await loadSharedData(); loadProjects();
      } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
}

document.getElementById('searchProject')?.addEventListener('input', debounce(loadProjects, 300));
document.getElementById('filterProjectStatus')?.addEventListener('change', loadProjects);
document.getElementById('filterProjectDept')?.addEventListener('change', loadProjects);

// ══════════════════════════════════════════════════════════════════════════════
// Kanban Tasks
// ══════════════════════════════════════════════════════════════════════════════
async function loadTasks() {
  setKanbanLoading(true);
  try {
    const params = {};
    const proj     = document.getElementById('filterTaskProject')?.value;
    const priority = document.getElementById('filterTaskPriority')?.value;
    const assignee = document.getElementById('filterTaskAssignee')?.value;
    const search   = document.getElementById('searchTask')?.value?.toLowerCase() || '';
    if (proj)     params.project  = proj;
    if (priority) params.priority = priority;
    if (assignee) params.assignee = assignee;
    let tasks = await api.tasks.list(params);
    if (search) tasks = tasks.filter(t => t.name.toLowerCase().includes(search));
    allTasks = tasks;
    renderKanban(tasks);
  } catch (err) { showToast('Lỗi tải công việc: ' + err.message, 'error'); }
}

function setKanbanLoading(loading) {
  ['kanban-not-started','kanban-in-progress','kanban-completed'].forEach(id => {
    if (loading) document.getElementById(id).innerHTML = '<div class="loading-spinner" style="padding:20px"><div class="spinner"></div></div>';
  });
}

const PRIORITY_VI = { Low: 'Thấp', Medium: 'Trung bình', High: 'Cao', Urgent: 'Khẩn cấp' };

function renderKanban(tasks) {
  const groups = { 'Not Started': [], 'In Progress': [], 'Completed': [] };
  tasks.forEach(t => { if (groups[t.status]) groups[t.status].push(t); });

  const colMap   = { 'Not Started': 'not-started', 'In Progress': 'in-progress', 'Completed': 'completed' };
  const countMap = { 'Not Started': 'countNotStarted', 'In Progress': 'countInProgress', 'Completed': 'countCompleted' };

  Object.entries(groups).forEach(([status, items]) => {
    const col     = document.getElementById(`kanban-${colMap[status]}`);
    const countEl = document.getElementById(countMap[status]);
    if (countEl) countEl.textContent = items.length;
    if (!col) return;
    if (!items.length) { col.innerHTML = '<div class="kanban-col__empty">Chưa có công việc</div>'; return; }
    col.innerHTML = items.map(t => {
      const dead   = t.deadline ? formatDate(t.deadline, true) : null;
      const overdue = status !== 'Completed' && isOverdue(t.deadline);
      return `
      <div class="task-card" onclick="showTaskDetail('${t._id}')">
        <div class="task-card__meta">
          ${priorityBadge(t.priority)}
          <span style="font-size:10px;color:var(--text-muted)">${t.project?.name?.slice(0,20) || ''}</span>
        </div>
        <div class="task-card__name">${t.name}</div>
        <div style="margin-bottom:6px"><div class="skills-wrap">
          ${(t.requiredSkills || []).slice(0,3).map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div></div>
        <div class="task-card__footer">
          <div class="task-card__assignee">
            ${t.assignee ? mkAvatar(t.assignee.fullName, 'sm') : '<span style="font-size:11px;color:var(--text-muted)">Chưa phân công</span>'}
            ${t.assignee ? `<span>${t.assignee.fullName}</span>` : ''}
          </div>
          ${dead ? `<span class="task-card__deadline ${overdue ? 'overdue' : ''}">${dead}</span>` : ''}
        </div>
      </div>`;
    }).join('');
  });
}

async function showTaskDetail(id) {
  try {
    const task = await api.tasks.get(id);
    const logs = await api.timelogs.byTask(id);
    const totalHours = logs.reduce((s, l) => s + l.hoursWorked, 0);

    const body = `
    <div style="margin-bottom:16px">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        ${priorityBadge(task.priority)} ${statusBadge(task.status)}
        <span style="font-size:11px;color:var(--text-muted)">Dự án: ${task.project?.name || '--'}</span>
      </div>
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">${task.description || 'Chưa có mô tả'}</div>
      <div class="grid-2" style="font-size:12px;gap:8px;color:var(--text-secondary)">
        <div>Hạn hoàn thành: <strong style="color:var(--text-primary)">${formatDate(task.deadline)}</strong></div>
        <div>Dự kiến: <strong style="color:var(--text-primary)">${task.estimatedHours}h</strong></div>
        <div>Người thực hiện: <strong style="color:var(--text-primary)">${task.assignee?.fullName || 'Chưa có'}</strong></div>
        <div>Tổng giờ đã ghi: <strong style="color:var(--accent-3)">${totalHours.toFixed(1)}h</strong></div>
      </div>
      <div style="margin-top:12px"><div class="form-label">Kỹ năng yêu cầu</div><div class="skills-wrap">${(task.requiredSkills||[]).map(s=>`<span class="skill-tag">${s}</span>`).join('') || '<span class="text-xs text-muted">Không yêu cầu</span>'}</div></div>
    </div>
    <div style="margin-bottom:16px">
      <div class="form-label" style="margin-bottom:8px">Đổi trạng thái</div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-sm ${task.status==='Not Started'?'btn-primary':'btn-secondary'}" onclick="updateTaskStatus('${id}','Not Started')">Chưa bắt đầu</button>
        <button class="btn btn-sm ${task.status==='In Progress'?'btn-primary':'btn-secondary'}" onclick="updateTaskStatus('${id}','In Progress')">Đang thực hiện</button>
        <button class="btn btn-sm ${task.status==='Completed'?'btn-primary':'btn-secondary'}" onclick="updateTaskStatus('${id}','Completed')">Hoàn thành</button>
      </div>
    </div>
    <div class="divider"></div>
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span class="form-label" style="margin:0">Nhật ký thời gian (${logs.length})</span>
        <button class="btn btn-secondary btn-xs" onclick="showAddTimelogModal('${id}','${task.assignee?._id||''}')">+ Ghi giờ</button>
      </div>
      ${logs.length ? `
      <div style="display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto">
        ${logs.map(l => `
        <div style="display:flex;gap:10px;align-items:flex-start;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px">
          ${mkAvatar(l.staff?.fullName || '?', 'sm')}
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600">${l.staff?.fullName} &middot; <span style="color:var(--accent-3)">${l.hoursWorked}h</span></div>
            <div style="font-size:11px;color:var(--text-secondary)">${l.notes || ''}</div>
            <div style="font-size:10px;color:var(--text-muted)">${formatDateTime(l.date)} ${l.qualityRating ? `&middot; ${l.qualityRating}/5` : ''}</div>
          </div>
          <button class="btn btn-xs btn-danger" onclick="deleteTimelog('${l._id}','${id}')">X</button>
        </div>`).join('')}
      </div>` : '<div class="empty-state" style="padding:16px"><div class="empty-state__sub">Chưa có timelog nào</div></div>'}
    </div>
    <div class="divider"></div>
    <div style="display:flex;gap:6px">
      <button class="btn btn-secondary btn-sm" onclick="editTask('${id}')">Chỉnh sửa</button>
      <button class="btn btn-danger btn-sm" onclick="deleteTask('${id}','${task.name.replace(/'/g,"\\'")}')">Xoá công việc</button>
    </div>`;

    modal.open({ title: task.name, body, hideFooter: true, wide: true });
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

async function updateTaskStatus(id, status) {
  try {
    await api.tasks.update(id, { status });
    showToast('Đã cập nhật trạng thái');
    modal.close(); loadTasks();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

function showAddTimelogModal(taskId, staffId) {
  const staffOptions = state.users.map(u => `<option value="${u._id}" ${u._id === staffId ? 'selected' : ''}>${u.fullName}</option>`).join('');
  modal.open({
    title: 'Ghi nhận giờ làm', confirmText: 'Lưu',
    body: `
    <div class="form-group"><label class="form-label">Nhân viên</label><select id="tl-staff" class="form-control"><option value="">-- Chọn --</option>${staffOptions}</select></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Số giờ</label><input id="tl-hours" type="number" step="0.5" min="0.5" max="24" class="form-control" value="2"></div>
      <div class="form-group"><label class="form-label">Ngày</label><input id="tl-date" type="date" class="form-control" value="${new Date().toISOString().slice(0,10)}"></div>
    </div>
    <div class="form-group"><label class="form-label">Ghi chú</label><input id="tl-notes" class="form-control" placeholder="Nội dung công việc đã làm..."></div>
    <div class="form-group"><label class="form-label">Đánh giá chất lượng (1–5)</label><input id="tl-quality" type="number" min="1" max="5" class="form-control" value="4"></div>`,
    onConfirm: async () => {
      const body = {
        task: taskId,
        staff: document.getElementById('tl-staff').value,
        hoursWorked: parseFloat(document.getElementById('tl-hours').value),
        date: document.getElementById('tl-date').value,
        notes: document.getElementById('tl-notes').value,
        qualityRating: parseInt(document.getElementById('tl-quality').value) || undefined,
      };
      if (!body.staff) return showToast('Vui lòng chọn nhân viên', 'error');
      if (!body.hoursWorked || body.hoursWorked <= 0) return showToast('Số giờ không hợp lệ', 'error');
      try {
        modal.setLoading(true);
        await api.timelogs.create(body);
        modal.close(); showToast('Đã ghi nhận giờ làm');
        showTaskDetail(taskId);
      } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
}

async function deleteTimelog(logId, taskId) {
  try {
    await api.timelogs.remove(logId);
    showToast('Đã xoá timelog');
    showTaskDetail(taskId);
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

function getTaskFormHtml(task = {}) {
  const projOptions = state.projects.map(p => `<option value="${p._id}" ${(task.project?._id||task.project)===p._id?'selected':''}>${p.name}</option>`).join('');
  const userOptions = state.users.map(u => `<option value="${u._id}" ${(task.assignee?._id||task.assignee)===u._id?'selected':''}>${u.fullName}</option>`).join('');
  const skillsStr   = (task.requiredSkills || []).join(', ');
  return `
  <div class="form-group"><label class="form-label">Tên công việc *</label><input id="f-task-name" class="form-control" value="${task.name || ''}" placeholder="Mô tả công việc..."></div>
  <div class="form-group"><label class="form-label">Mô tả</label><textarea id="f-task-desc" class="form-control">${task.description || ''}</textarea></div>
  <div class="form-row">
    <div class="form-group"><label class="form-label">Dự án *</label><select id="f-task-proj" class="form-control"><option value="">-- Chọn --</option>${projOptions}</select></div>
    <div class="form-group"><label class="form-label">Người thực hiện</label><select id="f-task-assignee" class="form-control"><option value="">-- Chưa phân công --</option>${userOptions}</select></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label class="form-label">Mức ưu tiên</label><select id="f-task-priority" class="form-control">
      <option value="Low" ${task.priority==='Low'?'selected':''}>Thấp</option>
      <option value="Medium" ${task.priority==='Medium'?'selected':''}>Trung bình</option>
      <option value="High" ${task.priority==='High'?'selected':''}>Cao</option>
      <option value="Urgent" ${task.priority==='Urgent'?'selected':''}>Khẩn cấp</option>
    </select></div>
    <div class="form-group"><label class="form-label">Trạng thái</label><select id="f-task-status" class="form-control">
      <option value="Not Started" ${task.status==='Not Started'?'selected':''}>Chưa bắt đầu</option>
      <option value="In Progress" ${task.status==='In Progress'?'selected':''}>Đang thực hiện</option>
      <option value="Completed" ${task.status==='Completed'?'selected':''}>Hoàn thành</option>
    </select></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label class="form-label">Dự kiến (giờ)</label><input id="f-task-hours" type="number" min="1" class="form-control" value="${task.estimatedHours || 8}"></div>
    <div class="form-group"><label class="form-label">Hạn hoàn thành</label><input id="f-task-deadline" type="date" class="form-control" value="${task.deadline ? task.deadline.slice(0,10) : ''}"></div>
  </div>
  <div class="form-group"><label class="form-label">Kỹ năng yêu cầu (cách nhau bởi dấu phẩy)</label><input id="f-task-skills" class="form-control" value="${skillsStr}" placeholder="Ví dụ: Python, React, Docker"></div>`;
}

document.getElementById('btnAddTask')?.addEventListener('click', () => {
  modal.open({
    title: 'Tạo công việc mới', body: getTaskFormHtml(), wide: true, confirmText: 'Tạo công việc',
    onConfirm: async () => {
      const body = {
        name:          document.getElementById('f-task-name').value.trim(),
        description:   document.getElementById('f-task-desc').value.trim(),
        project:       document.getElementById('f-task-proj').value,
        assignee:      document.getElementById('f-task-assignee').value || undefined,
        priority:      document.getElementById('f-task-priority').value,
        status:        document.getElementById('f-task-status').value,
        estimatedHours: parseInt(document.getElementById('f-task-hours').value) || 8,
        deadline:      document.getElementById('f-task-deadline').value || undefined,
        requiredSkills: document.getElementById('f-task-skills').value.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (!body.name)    return showToast('Vui lòng nhập tên công việc', 'error');
      if (!body.project) return showToast('Vui lòng chọn dự án', 'error');
      try {
        modal.setLoading(true);
        await api.tasks.create(body);
        modal.close(); showToast('Đã tạo công việc'); loadTasks();
      } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
});

async function editTask(id) {
  try {
    const task = await api.tasks.get(id);
    modal.open({
      title: 'Cập nhật công việc', body: getTaskFormHtml(task), wide: true, confirmText: 'Cập nhật',
      onConfirm: async () => {
        const body = {
          name:          document.getElementById('f-task-name').value.trim(),
          description:   document.getElementById('f-task-desc').value.trim(),
          project:       document.getElementById('f-task-proj').value,
          assignee:      document.getElementById('f-task-assignee').value || null,
          priority:      document.getElementById('f-task-priority').value,
          status:        document.getElementById('f-task-status').value,
          estimatedHours: parseInt(document.getElementById('f-task-hours').value) || 8,
          deadline:      document.getElementById('f-task-deadline').value || undefined,
          requiredSkills: document.getElementById('f-task-skills').value.split(',').map(s => s.trim()).filter(Boolean),
        };
        try {
          modal.setLoading(true);
          await api.tasks.update(id, body);
          modal.close(); showToast('Đã cập nhật công việc'); loadTasks();
        } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
        finally { modal.setLoading(false); }
      },
    });
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

async function deleteTask(id, name) {
  modal.open({
    title: 'Xác nhận xoá',
    body: `<p style="color:var(--text-secondary)">Bạn có chắc muốn xoá công việc <strong style="color:var(--text-primary)">${name}</strong>?</p>`,
    confirmText: 'Xoá',
    onConfirm: async () => {
      try {
        modal.setLoading(true);
        await api.tasks.remove(id);
        modal.close(); showToast('Đã xoá công việc'); loadTasks();
      } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
      finally { modal.setLoading(false); }
    },
  });
}

document.getElementById('searchTask')?.addEventListener('input', debounce(loadTasks, 300));



async function showProjectDetail(id) {
  try {
    modal.setLoading(true);
    const p = await api.projects.get(id);
    const dColor = p.department?.color || '#6366f1';
    const dead = p.deadline ? formatDate(p.deadline) : '--';
    
    const membersList = (p.members || []).map(m => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        ${mkAvatar(m.fullName, 'sm')}
        <div>
           <div style="font-size:13px;color:var(--text-primary)">${m.fullName}</div>
           <div style="font-size:11px;color:var(--text-muted)">${m.email || ''}</div>
        </div>
      </div>
    `).join('') || '<div style="color:var(--text-muted);font-size:13px">Chưa có thành viên</div>';
    
    let actionArea = '';
    const cu = state.currentUser;

    if (cu && cu.role === 'user' && cu.linkedUser) {
      const myReq = await api.projects.getMyRequest(id);
      const isMember = p.members?.some(m => m._id === cu.linkedUser._id || m === cu.linkedUser._id || m._id === cu.linkedUser || m === cu.linkedUser);

      if (myReq) {
        const typeStr = myReq.type === 'join' ? 'tham gia' : 'rời';
        actionArea = `
          <div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);padding:12px 16px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-top:16px;">
            <div>
              <div style="color:var(--yellow);font-weight:600;font-size:13px">Đang chờ Admin duyệt yêu cầu ${typeStr} dự án</div>
              <div style="color:var(--text-muted);font-size:11px">${myReq.reason ? 'Lý do: "' + myReq.reason + '" &middot; ' : ''}Gửi lúc: ${formatDateTime(myReq.createdAt)}</div>
            </div>
            <button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="cancelProjectRequest('${myReq._id}', '${p._id}')">Huỷ yêu cầu</button>
          </div>
        `;
      } else if (isMember) {
        actionArea = `
          <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:16px;">
            <button class="btn btn-danger" onclick="promptProjectRequest('${p._id}', 'leave', '${p.name.replace(/'/g, "\\'")}')">Gửi yêu cầu rời dự án</button>
          </div>
        `;
      } else {
        actionArea = `
          <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:16px;">
            <button class="btn btn-primary" onclick="promptProjectRequest('${p._id}', 'join', '${p.name.replace(/'/g, "\\'")}')">Gửi yêu cầu tham gia dự án</button>
          </div>
        `;
      }
    }

    const html = `
      <div style="margin-bottom:16px;display:flex;gap:8px;align-items:center;">
        <span class="badge" style="background:${dColor};color:#fff">${p.department?.name || 'Không phòng ban'}</span>
        ${statusBadge(p.status)}
      </div>
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:20px;line-height:1.6;white-space:pre-line">
        ${p.description || 'Chưa có mô tả'}
      </div>
      <div class="grid-2" style="gap:16px;margin-bottom:20px">
        <div class="kpi-card">
           <div class="kpi-card__label">Ngày tạo</div>
           <div style="color:var(--text-primary);font-size:14px;font-weight:600">${formatDate(p.createdAt)}</div>
        </div>
        <div class="kpi-card">
           <div class="kpi-card__label">Hạn chót</div>
           <div style="color:var(--text-primary);font-size:14px;font-weight:600">${dead}</div>
        </div>
      </div>
      <div style="margin-bottom:10px">
         <h4 style="color:var(--text-primary);margin-bottom:12px;font-size:14px">Thành viên tham gia (${p.members?.length || 0})</h4>
         <div style="max-height:180px;overflow-y:auto;padding-right:8px">
            ${membersList}
         </div>
      </div>
      ${actionArea}
    `;

    modal.open({
      title: p.name,
      body: html,
      wide: true,
      hideConfirm: true
    });
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  } finally {
    modal.setLoading(false);
  }
}

function promptProjectRequest(projectId, type, projectName) {
  const isJoin = type === 'join';
  modal.open({
    title: isJoin ? 'Yêu cầu tham gia dự án' : 'Yêu cầu rời dự án',
    body: `
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:12px">
        Bạn đang gửi yêu cầu ${isJoin ? 'tham gia vào' : 'rời khỏi'} dự án <strong style="color:var(--text-primary)">${projectName}</strong>. Yêu cầu sẽ được chuyển đến Quản trị viên phê duyệt.
      </p>
      <div class="form-group">
        <label class="form-label">Lý do / Ghi chú (tùy chọn)</label>
        <textarea id="f-req-reason" class="form-control" placeholder="Nhập lý do gửi yêu cầu..." style="height:80px"></textarea>
      </div>
    `,
    confirmText: isJoin ? 'Gửi yêu cầu tham gia' : 'Gửi yêu cầu rời dự án',
    onConfirm: async () => {
      const reason = document.getElementById('f-req-reason')?.value?.trim() || '';
      try {
        modal.setLoading(true);
        if (isJoin) {
          await api.projects.requestJoin(projectId, { reason });
          showToast('Đã gửi yêu cầu tham gia, đang chờ Admin duyệt');
        } else {
          await api.projects.requestLeave(projectId, { reason });
          showToast('Đã gửi yêu cầu rời dự án, đang chờ Admin duyệt');
        }
        modal.close();
        showProjectDetail(projectId);
      } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
      } finally {
        modal.setLoading(false);
      }
    }
  });
}

async function cancelProjectRequest(requestId, projectId) {
  try {
    modal.setLoading(true);
    await api.projects.cancelRequest(requestId);
    showToast('Đã huỷ yêu cầu thành công');
    showProjectDetail(projectId);
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  } finally {
    modal.setLoading(false);
  }
}
