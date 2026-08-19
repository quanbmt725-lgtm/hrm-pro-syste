const fs = require('fs');

let content = fs.readFileSync('C:/Users/Quan/Downloads/code/test_manager/public/js/projects.js', 'utf8');

const oldRenderStr = `    <div class="project-item">
      <div style="width:4px;height:60px;background:\\${dColor};border-radius:2px;flex-shrink:0"></div>
      <div class="project-item__info">
        <div class="project-item__name">\\${p.name}</div>
        <div class="project-item__desc">\\${p.description || 'Chưa có mô tả'}</div>
        <div class="project-item__meta">
          \\${statusBadge(p.status)}
          <span style="font-size:11px;color:var(--text-muted)">Phòng ban: \\${p.department?.name || '--'}</span>
          <span style="font-size:11px;color:\\${overdue ? 'var(--red)' : 'var(--text-muted)'}">Hạn: \\${dead}</span>
        </div>
      </div>
      <div class="project-item__progress" style="min-width:140px">
        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;display:flex;justify-content:space-between">
          <span>Tiến độ</span><span style="font-weight:700;color:var(--text-primary)">\\${p.progress}%</span>
        </div>
        <div class="progress-bar progress-bar--lg">
          <div class="progress-bar__fill" style="width:\\${p.progress}%"></div>
        </div>
      </div>
      <div class="project-item__actions">
        <button class="btn btn-ghost btn-xs" onclick="editProject('\\${p._id}')">Sửa</button>
        <button class="btn btn-danger btn-xs" onclick="deleteProject('\\${p._id}', '\\${p.name.replace(/'/g,"\\\\'")}')">Xoá</button>
      </div>
    </div>\`;`;

const newRenderStr = `    <div class="project-item" style="cursor:pointer;" onclick="showProjectDetail('\\${p._id}')">
      <div style="width:4px;height:60px;background:\\${dColor};border-radius:2px;flex-shrink:0"></div>
      <div class="project-item__info">
        <div class="project-item__name">\\${p.name}</div>
        <div class="project-item__desc">\\${p.description || 'Chưa có mô tả'}</div>
        <div class="project-item__meta">
          \\${statusBadge(p.status)}
          <span style="font-size:11px;color:var(--text-muted)">Phòng ban: \\${p.department?.name || '--'}</span>
          <span style="font-size:11px;color:\\${overdue ? 'var(--red)' : 'var(--text-muted)'}">Hạn: \\${dead}</span>
        </div>
      </div>
      <div class="project-item__progress" style="min-width:140px">
        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;display:flex;justify-content:space-between">
          <span>Tiến độ</span><span style="font-weight:700;color:var(--text-primary)">\\${p.progress}%</span>
        </div>
        <div class="progress-bar progress-bar--lg">
          <div class="progress-bar__fill" style="width:\\${p.progress}%"></div>
        </div>
      </div>
      <div class="project-item__actions" onclick="event.stopPropagation()">
        \\${state.currentUser?.role === 'admin' ? \`
          <button class="btn btn-ghost btn-xs" onclick="editProject('\\${p._id}')">Sửa</button>
          <button class="btn btn-danger btn-xs" onclick="deleteProject('\\${p._id}', '\\${p.name.replace(/'/g,"\\\\'")}')">Xoá</button>
        \` : ''}
      </div>
    </div>\`;`;

// Re-write the replace using regex or index
const startIndex = content.indexOf('<div class="project-item">');
const endIndex = content.indexOf('</div>\`;', startIndex) + 8;
if (startIndex !== -1) {
    content = content.substring(0, startIndex) + newRenderStr + content.substring(endIndex);
} else {
    console.log("Could not find project-item HTML block.");
}

const newFunctions = `

async function showProjectDetail(id) {
  try {
    modal.setLoading(true);
    const p = await api.projects.get(id); // this now includes members
    const dColor = p.department?.color || '#6366f1';
    const dead = p.deadline ? formatDate(p.deadline) : '--';
    
    const membersList = (p.members || []).map(m => \`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        \${mkAvatar(m.fullName, 'sm')}
        <div>
           <div style="font-size:13px;color:var(--text-primary)">\${m.fullName}</div>
           <div style="font-size:11px;color:var(--text-muted)">\${m.email || ''}</div>
        </div>
      </div>
    \`).join('') || '<div style="color:var(--text-muted);font-size:13px">Chưa có thành viên</div>';
    
    let joinLeaveBtn = '';
    const cu = state.currentUser;
    if (cu && cu.role === 'user' && cu.linkedUser) {
       const isMember = p.members?.some(m => m._id === cu.linkedUser._id || m === cu.linkedUser._id);
       if (isMember) {
           joinLeaveBtn = \`<button class="btn btn-danger" onclick="leaveProject('\${p._id}')">Rời bỏ dự án</button>\`;
       } else {
           joinLeaveBtn = \`<button class="btn btn-primary" onclick="joinProject('\${p._id}')">Tham gia dự án</button>\`;
       }
    }

    const html = \`
      <div style="margin-bottom:16px;">
        <span class="badge" style="background:\${dColor};color:#fff">\${p.department?.name || 'Không phòng ban'}</span>
        \${statusBadge(p.status)}
      </div>
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:20px;line-height:1.6">
        \${p.description || 'Chưa có mô tả'}
      </div>
      <div class="grid-2" style="gap:16px;margin-bottom:20px">
        <div class="kpi-card">
           <div class="kpi-card__label">Ngày tạo</div>
           <div style="color:var(--text-primary);font-size:14px;font-weight:600">\${formatDate(p.createdAt)}</div>
        </div>
        <div class="kpi-card">
           <div class="kpi-card__label">Hạn chót</div>
           <div style="color:var(--text-primary);font-size:14px;font-weight:600">\${dead}</div>
        </div>
      </div>
      <div style="margin-bottom:20px">
         <h4 style="color:var(--text-primary);margin-bottom:12px;font-size:14px">Thành viên tham gia (\${p.members?.length || 0})</h4>
         <div style="max-height:200px;overflow-y:auto;padding-right:8px">
            \${membersList}
         </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:12px">
        \${joinLeaveBtn}
      </div>
    \`;

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

async function joinProject(id) {
   try {
     modal.setLoading(true);
     await api.projects.join(id);
     modal.close();
     showToast('Đã tham gia dự án');
     loadProjects();
   } catch(err) { showToast('Lỗi: '+err.message, 'error'); modal.setLoading(false); }
}
async function leaveProject(id) {
   try {
     modal.setLoading(true);
     await api.projects.leave(id);
     modal.close();
     showToast('Đã rời dự án');
     loadProjects();
   } catch(err) { showToast('Lỗi: '+err.message, 'error'); modal.setLoading(false); }
}
`;

if (!content.includes('function showProjectDetail')) {
    content += newFunctions;
}

fs.writeFileSync('C:/Users/Quan/Downloads/code/test_manager/public/js/projects.js', content, 'utf8');
console.log('projects.js updated successfully');
