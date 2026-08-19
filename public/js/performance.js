/* ─── performance.js — Bảng điểm tổng hợp & Radar tiếng Việt ────────────── */
let radarChart = null, perfData = null;

async function loadPerformanceSection() {
  await loadSharedData();
  loadPerformanceReport();
  populateSelectOptions('filterPerfDept', state.departments, 'Tất cả phòng ban');
  document.getElementById('filterPerfDept')?.addEventListener('change', loadPerformanceReport);
}

async function loadPerformanceReport() {
  const container = document.getElementById('clusterView');
  container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div>Đang tính toán...</div>';
  try {
    const dept = document.getElementById('filterPerfDept')?.value || '';
    const params = {};
    if (dept) params.department = dept;
    const data = await api.performance.report(params);
    perfData = data;

    document.getElementById('perfAvgScore').textContent = (data.summary.avgScore || 0).toFixed(1);
    animateCount('perfHighCount', data.summary.high || 0);
    animateCount('perfMedCount',  data.summary.medium || 0);
    animateCount('perfLowCount',  data.summary.low || 0);

    renderClusterView(data.users);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Lỗi tải báo cáo</div><div class="empty-state__sub">${err.message}</div></div>`;
    showToast('Lỗi: ' + err.message, 'error');
  }
}

function renderClusterView(users) {
  const container = document.getElementById('clusterView');
  const groups = { high: [], medium: [], low: [] };
  users.forEach(u => { if (groups[u.cluster]) groups[u.cluster].push(u); });

  const clusterConfig = [
    { key: 'high',   label: 'Hiệu suất cao',   note: 'Sẵn sàng nhận dự án phức tạp, nguồn lực ưu tiên', colorClass: 'high'   },
    { key: 'medium', label: 'Trung bình',      note: 'Có tiềm năng phát triển, nên được hướng dẫn thêm',  colorClass: 'medium' },
    { key: 'low',    label: 'Cần cải thiện',   note: 'Cần xây dựng kế hoạch cải thiện và hỗ trợ kịp thời', colorClass: 'low'    },
  ];

  container.innerHTML = clusterConfig.map(cfg => {
    const items = groups[cfg.key];
    if (!items.length) return '';
    return `
    <div class="cluster-section">
      <div class="cluster-section__header ${cfg.colorClass}">
        <div>
          <div class="cluster-section__title">${cfg.label}</div>
          <div class="cluster-section__note">${cfg.note}</div>
        </div>
        <span class="cluster-section__count">${items.length} người &middot; Điểm ${cfg.key === 'high' ? '&ge; 8.0' : cfg.key === 'medium' ? '6.0 – 7.9' : '&lt; 6.0'}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Phòng ban</th>
              <th>Điểm HS</th>
              <th>Hoàn thành</th>
              <th>Đúng hạn</th>
              <th>Giờ đã ghi</th>
              <th>Chất lượng TB</th>
              <th>Workload</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(m => {
              const u = m.user, s = m.stats;
              const dColor = u.department?.color || '#6366f1';
              return `<tr>
                <td>
                  <div class="td-name">
                    ${mkAvatar(u.fullName, 'sm')}
                    <div>
                      <div>${u.fullName}</div>
                      <div class="td-sub">${u.position || '--'}</div>
                    </div>
                  </div>
                </td>
                <td><span style="font-size:11px;padding:2px 8px;background:${dColor}22;color:${dColor};border-radius:4px">${u.department?.name || '--'}</span></td>
                <td><span class="perf-table-score">${m.compositeScore.toFixed(1)}</span></td>
                <td><span style="font-size:13px">${s.completedTasks}/${s.totalTasks}</span></td>
                <td><span style="font-size:13px;color:${s.onTimeRate >= 80 ? 'var(--green)' : s.onTimeRate >= 60 ? 'var(--yellow)' : 'var(--red)'}">${s.onTimeRate}%</span></td>
                <td>${s.totalHoursLogged}h</td>
                <td>
                  <div style="display:flex;gap:2px">
                    ${[1,2,3,4,5].map(i => `<div style="width:8px;height:8px;border-radius:2px;background:${i <= Math.round(s.avgQualityRating) ? 'var(--accent-2)' : 'rgba(255,255,255,0.08)'}"></div>`).join('')}
                    <span style="font-size:11px;margin-left:4px;color:var(--text-secondary)">${s.avgQualityRating.toFixed(1)}</span>
                  </div>
                </td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px">
                    <div class="progress-bar" style="width:60px"><div class="progress-bar__fill" style="width:${u.workloadPercent}%;background:${u.workloadPercent > 85 ? 'var(--red)' : u.workloadPercent > 70 ? 'var(--yellow)' : 'var(--gradient-primary)'}"></div></div>
                    <span style="font-size:11px">${u.workloadPercent}%</span>
                  </div>
                </td>
                <td>
                  <button class="btn btn-secondary btn-xs" onclick="showRadarChart('${u._id}', '${u.fullName.replace(/'/g,"\\'")}')">Biểu đồ Radar</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }).join('') || '<div class="empty-state"><div class="empty-state__title">Không có dữ liệu</div></div>';
}

async function showRadarChart(userId, userName) {
  modal.open({
    title: `Biểu đồ năng lực — ${userName}`, wide: true, hideFooter: true,
    body: `<div class="radar-modal-wrap"><canvas id="radarCanvas" style="max-width:380px;max-height:380px"></canvas></div><div id="radarStats" style="margin-top:20px"></div>`,
  });
  try {
    const data = await api.performance.user(userId);
    const r = data.radarData;
    const ctx = document.getElementById('radarCanvas').getContext('2d');
    if (radarChart) radarChart.destroy();
    radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Chuyên môn', 'Đúng hạn', 'Khối lượng CV', 'Tinh thần TN', 'Mức độ nỗ lực'],
        datasets: [{
          data: [r.expertise, r.timeliness, r.volume, r.responsibility, r.effort],
          backgroundColor: 'rgba(99,102,241,0.15)', borderColor: '#6366f1', borderWidth: 2,
          pointBackgroundColor: '#8b5cf6', pointBorderColor: '#fff', pointRadius: 5,
        }],
      },
      options: {
        responsive: true,
        scales: {
          r: {
            min: 0, max: 10,
            ticks: { stepSize: 2, font: { size: 10 }, color: '#64748b', backdropColor: 'transparent' },
            grid: { color: 'rgba(255,255,255,0.08)' }, angleLines: { color: 'rgba(255,255,255,0.08)' },
            pointLabels: { font: { size: 11, weight: '600' }, color: '#94a3b8' },
          },
        },
        plugins: { legend: { display: false } },
      },
    });

    document.getElementById('radarStats').innerHTML = `
    <div class="grid-3" style="gap:10px">
      ${[
        { label: 'Chuyên môn', val: r.expertise.toFixed(1), color: 'var(--accent-3)' },
        { label: 'Đúng hạn', val: r.timeliness.toFixed(1), color: 'var(--green)' },
        { label: 'Khối lượng', val: r.volume.toFixed(1), color: 'var(--cyan)' },
        { label: 'Tinh thần TN', val: r.responsibility.toFixed(1), color: 'var(--yellow)' },
        { label: 'Nỗ lực', val: r.effort.toFixed(1), color: 'var(--orange)' },
        { label: 'Tổng điểm', val: data.compositeScore.toFixed(1), color: 'var(--accent-1)' },
      ].map(item => `
        <div style="text-align:center;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--border)">
          <div style="font-size:20px;font-weight:800;color:${item.color}">${item.val}<span style="font-size:11px;color:var(--text-muted)">/10</span></div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${item.label}</div>
        </div>`).join('')}
    </div>
    <div style="margin-top:12px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;text-align:center">
      ${clusterBadge(data.cluster, data.clusterLabel)} <span style="font-size:12px;color:var(--text-secondary);margin-left:8px">${data.clusterNote}</span>
    </div>`;
  } catch (err) { showToast('Lỗi tải dữ liệu: ' + err.message, 'error'); }
}

document.getElementById('btnExportCSV')?.addEventListener('click', () => {
  if (!perfData || !perfData.users.length) { showToast('Chưa có dữ liệu để xuất', 'error'); return; }
  const headers = ['Họ tên', 'Phòng ban', 'Vị trí', 'Điểm HS', 'Nhóm', 'Hoàn thành', 'Đúng hạn (%)', 'Giờ làm', 'Chất lượng TB', 'Workload (%)'];
  const rows = perfData.users.map(m => [
    m.user.fullName, m.user.department?.name || '', m.user.position || '',
    m.compositeScore, m.clusterLabel, `${m.stats.completedTasks}/${m.stats.totalTasks}`,
    m.stats.onTimeRate, m.stats.totalHoursLogged, m.stats.avgQualityRating, m.user.workloadPercent,
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `bao_cao_hieu_suat_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast('Đã xuất CSV thành công');
});

document.getElementById('btnRefreshPerf')?.addEventListener('click', loadPerformanceReport);
