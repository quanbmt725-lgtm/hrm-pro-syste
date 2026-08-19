/* ─── api.js — API client với JWT Bearer token ───────────────────────────── */
const BASE_URL = '';

function getToken() {
  return localStorage.getItem('hrm_token') || '';
}

async function request(method, path, body) {
  const token = getToken();
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE_URL + path, opts);

  // Token hết hạn hoặc chưa đăng nhập → redirect login
  if (res.status === 401) {
    localStorage.removeItem('hrm_token');
    localStorage.removeItem('hrm_user');
    window.location.href = '/login.html';
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');
  return data;
}

const api = {
  get:    (path)         => request('GET', path),
  post:   (path, body)   => request('POST', path, body),
  put:    (path, body)   => request('PUT', path, body),
  delete: (path)         => request('DELETE', path),

  auth: {
    login:          (body)   => request('POST', '/api/auth/login', body),
    me:             ()       => request('GET',  '/api/auth/me'),
    changePassword: (body)   => request('PUT',  '/api/auth/change-password', body),
    checkPassword:  (body)   => request('POST', '/api/auth/check-password', body),
  },

  accounts: {
    list:          ()        => request('GET',    '/api/accounts'),
    create:        (body)    => request('POST',   '/api/accounts', body),
    update:        (id, body)=> request('PUT',    `/api/accounts/${id}`, body),
    remove:        (id)      => request('DELETE', `/api/accounts/${id}`),
    resetPassword: (id, body)=> request('PUT',    `/api/accounts/${id}/reset-password`, body),
  },

  dashboard: {
    stats: () => request('GET', '/api/dashboard/stats'),
  },
  departments: {
    list:   ()        => request('GET',    '/api/departments'),
    get:    (id)      => request('GET',    `/api/departments/${id}`),
    create: (body)    => request('POST',   '/api/departments', body),
    update: (id, body)=> request('PUT',    `/api/departments/${id}`, body),
    remove: (id)      => request('DELETE', `/api/departments/${id}`),
  },
  users: {
    list:   (params)  => request('GET',    '/api/users' + toQuery(params)),
    get:    (id)      => request('GET',    `/api/users/${id}`),
    create: (body)    => request('POST',   '/api/users', body),
    update: (id, body)=> request('PUT',    `/api/users/${id}`, body),
    remove: (id)      => request('DELETE', `/api/users/${id}`),
  },
  projects: {
    list:   (params)  => request('GET',    '/api/projects' + toQuery(params)),
    get:    (id)      => request('GET',    `/api/projects/${id}`),
    create: (body)    => request('POST',   '/api/projects', body),
    update: (id, body)=> request('PUT',    `/api/projects/${id}`, body),
    remove: (id)      => request('DELETE', `/api/projects/${id}`),
  },
  tasks: {
    list:           (params) => request('GET',  '/api/tasks' + toQuery(params)),
    get:            (id)     => request('GET',  `/api/tasks/${id}`),
    create:         (body)   => request('POST', '/api/tasks', body),
    update:         (id, b)  => request('PUT',  `/api/tasks/${id}`, b),
    remove:         (id)     => request('DELETE', `/api/tasks/${id}`),
    aiSuggest:      (params) => request('GET',  '/api/tasks/ai-suggest' + toQuery(params)),
    pendingApproval:()       => request('GET',  '/api/tasks/pending-approval'),
    submitApproval: (id, b)  => request('PUT',  `/api/tasks/${id}/submit-approval`, b),
    approve:        (id, b)  => request('PUT',  `/api/tasks/${id}/approve`, b),
  },
  timelogs: {
    list:          (params) => request('GET',    '/api/timelogs' + toQuery(params)),
    byTask:        (taskId) => request('GET',    `/api/timelogs?task=${taskId}`),
    create:        (body)   => request('POST',   '/api/timelogs', body),
    remove:        (id)     => request('DELETE', `/api/timelogs/${id}`),
    pending:       ()       => request('GET',    '/api/timelogs/pending'),
    approve:       (id, b)  => request('PUT',    `/api/timelogs/${id}/approve`, b),
    approvalStats: ()       => request('GET',    '/api/timelogs/approval-stats'),
  },
  performance: {
    report: (params) => request('GET', '/api/performance/report' + toQuery(params)),
    user:   (id)     => request('GET', `/api/performance/user/${id}`),
  },
};

function toQuery(params) {
  if (!params || !Object.keys(params).length) return '';
  return '?' + new URLSearchParams(params).toString();
}
