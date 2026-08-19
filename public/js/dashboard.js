/* ─── dashboard.js ────────────────────────────────────────────────────────── */
let chartProjStatus = null, chartDeptWL = null, chartWeekly = null, chartProjProg = null;

async function loadDashboard() {
  try {
    const data = await api.dashboard.stats();
    renderKPIs(data);
    renderProjectStatusChart(data.projectsByStatus);
    renderDeptWorkloadChart(data.deptWorkload);
    renderWeeklyChart(data.weeklyHours);
    renderProjectProgressChart(data.projectProgress);
    renderRecentActivity(data.recentLogs);
  } catch (err) {
    showToast('Lỗi tải dashboard: ' + err.message, 'error');
  }
}

function renderKPIs(data) {
  const byStatus = {};
  (data.projectsByStatus || []).forEach(s => { byStatus[s._id] = s.count; });
  const taskByStatus = {};
  (data.tasksByStatus || []).forEach(s => { taskByStatus[s._id] = s.count; });
  const taskByPriority = {};
  (data.tasksByPriority || []).forEach(s => { taskByPriority[s._id] = s.count; });

  animateCount('kpiProjects',   data.totalProjects || 0);
  animateCount('kpiUsers',      data.totalUsers    || 0);
  animateCount('kpiTasks',      data.totalTasks    || 0);
  animateCount('kpiInProgress', taskByStatus['In Progress'] || 0);

  document.getElementById('kpiProjectsActive').textContent = byStatus['Active'] || 0;
  document.getElementById('kpiAvgWorkload').textContent    = `${parseFloat(data.avgWorkload || 0).toFixed(0)}%`;
  document.getElementById('kpiTasksDone').textContent      = taskByStatus['Completed'] || 0;
  document.getElementById('kpiUrgent').textContent         = taskByPriority['Urgent']  || 0;
}

function animateCount(elId, target) {
  const el = document.getElementById(elId);
  if (!el) return;
  const duration = 800, start = Date.now(), from = parseInt(el.textContent) || 0;
  const tick = () => {
    const p = Math.min((Date.now() - start) / duration, 1);
    el.textContent = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const ACCENT_COLORS = ['#6366f1','#8b5cf6','#22d3ee','#34d399','#fbbf24','#f87171','#fb923c'];

const STATUS_VI = {
  'Active': 'Đang hoạt động', 'Planning': 'Lên kế hoạch',
  'On Hold': 'Tạm dừng', 'Completed': 'Hoàn thành',
  'Not Started': 'Chưa bắt đầu', 'In Progress': 'Đang thực hiện',
};

function renderProjectStatusChart(data) {
  const labels = (data || []).map(d => STATUS_VI[d._id] || d._id);
  const values = (data || []).map(d => d.count);
  const ctx = document.getElementById('chartProjectStatus').getContext('2d');
  if (chartProjStatus) chartProjStatus.destroy();
  chartProjStatus = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: ACCENT_COLORS, borderWidth: 0, hoverBorderWidth: 2, hoverBorderColor: '#fff' }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 14, font: { size: 11 }, boxWidth: 10 } },
        tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw} dự án` } },
      },
      cutout: '65%',
    },
  });
}

function renderDeptWorkloadChart(data) {
  const labels = (data || []).map(d => d.name);
  const values = (data || []).map(d => Math.round(d.avgWorkload));
  const colors = (data || []).map(d => d.color || '#6366f1');
  const ctx = document.getElementById('chartDeptWorkload').getContext('2d');
  if (chartDeptWL) chartDeptWL.destroy();
  chartDeptWL = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data: values, backgroundColor: colors.map(c => c + '99'), borderColor: colors, borderWidth: 1, borderRadius: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.raw}% workload` } } },
      scales: {
        x: { max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: (v) => v + '%' } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  });
}

function renderWeeklyChart(data) {
  const allDays = [];
  for (let i = 6; i >= 0; i--) {
    allDays.push(new Date(Date.now() - i * 86400000).toISOString().split('T')[0]);
  }
  const byDay = {};
  (data || []).forEach(d => { byDay[d._id] = d.hours; });
  const labels = allDays.map(d => new Date(d + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' }));
  const values = allDays.map(d => Math.round((byDay[d] || 0) * 10) / 10);
  const ctx = document.getElementById('chartWeeklyHours').getContext('2d');
  if (chartWeekly) chartWeekly.destroy();
  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, 'rgba(99,102,241,0.4)');
  grad.addColorStop(1, 'rgba(99,102,241,0.02)');
  chartWeekly = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ data: values, borderColor: '#6366f1', backgroundColor: grad, borderWidth: 2, fill: true, tension: 0.4, pointBackgroundColor: '#6366f1', pointRadius: 4, pointHoverRadius: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.raw} giờ` } } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 10 }, callback: (v) => v + 'h' } },
      },
    },
  });
}

function renderProjectProgressChart(data) {
  const labels = (data || []).map(d => d.name.length > 28 ? d.name.slice(0, 28) + '…' : d.name);
  const values = (data || []).map(d => d.progress);
  const ctx = document.getElementById('chartProjectProgress').getContext('2d');
  if (chartProjProg) chartProjProg.destroy();
  const grad = ctx.createLinearGradient(200, 0, 0, 0);
  grad.addColorStop(0, '#8b5cf6');
  grad.addColorStop(1, '#6366f1');
  chartProjProg = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data: values, backgroundColor: grad, borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.raw}% hoàn thành` } } },
      scales: {
        x: { max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: (v) => v + '%' } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  });
}

function renderRecentActivity(logs) {
  const container = document.getElementById('recentActivity');
  if (!logs || !logs.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state__title">Chưa có hoạt động</div></div>';
    return;
  }
  container.innerHTML = logs.map(log => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border)">
      ${mkAvatar(log.staff?.fullName || '?', 'sm')}
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${log.staff?.fullName || 'N/A'}</div>
        <div class="truncate" style="font-size:11px;color:var(--text-secondary)">
          ${log.task?.name || 'N/A'} — ${log.task?.project?.name || ''}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:1px">
          ${log.hoursWorked}h &middot; ${formatDateTime(log.date)}
          ${log.qualityRating ? `&middot; Đánh giá: ${log.qualityRating}/5` : ''}
        </div>
      </div>
    </div>
  `).join('');
}
