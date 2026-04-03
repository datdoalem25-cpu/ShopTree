// ==========================================
//   API SERVICE - Tập trung tất cả API calls
// ==========================================

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

function buildAuthHeaders(user, extraHeaders = {}) {
  // encodeURIComponent để tránh lỗi non-ISO-8859-1 (tiếng Việt có dấu trong HTTP header)
  const safeName = user?.fullName ? encodeURIComponent(user.fullName) : '';
  return {
    'x-user-id':   user?.id   || '',
    'x-user-role': user?.role || '',
    'x-user-name': safeName,
    ...extraHeaders,
  };
}

// ===== AUTH =====

export async function loginApi(email, password, otpToken = null) {
  const body = { email, password };
  if (otpToken) body.otpToken = otpToken;
  const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  return { ok: response.ok, data: result };
}

export async function registerApi(fullName, email, password) {
  const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, password })
  });
  const result = await response.json();
  return { ok: response.ok, data: result };
}

// ===== PRODUCTS =====

export async function getMyProductsApi(user) {
  const response = await fetch(`${API_BASE}/api/v1/farmer/products`, {
    headers: buildAuthHeaders(user),
  });
  const result = await response.json();
  return result;
}

export async function createProductApi(formData, user) {
  const response = await fetch(`${API_BASE}/api/v1/farmer/products`, {
    method: 'POST',
    headers: buildAuthHeaders(user),
    body: formData
  });
  const result = await response.json().catch(() => ({}));
  return { ok: response.ok, message: result?.message, data: result?.data };
}

export async function updateProductApi(productId, data, user) {
  const response = await fetch(`${API_BASE}/api/v1/farmer/products/${productId}`, {
    method: 'PATCH',
    headers: buildAuthHeaders(user, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  });
  const result = await response.json().catch(() => ({}));
  return { ok: response.ok, data: result?.data };
}

export async function deleteProductApi(productId, user) {
  const response = await fetch(`${API_BASE}/api/v1/farmer/products/${productId}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(user),
  });
  return { ok: response.ok };
}

// ===== CONSUMER =====

export async function trackProductApi(batchSerial) {
  const response = await fetch(`${API_BASE}/api/v1/consume/track/${batchSerial}`);
  const result = await response.json();
  return { ok: response.ok, data: result };
}

// ===== ADMIN =====

export async function getPendingProductsApi() {
  const response = await fetch(`${API_BASE}/api/v1/admin/products/pending`);
  const result = await response.json();
  return result;
}

export async function updateProductStatusApi(productId, newStatus, user) {
  const response = await fetch(`${API_BASE}/api/v1/admin/products/${productId}/status`, {
    method: 'PUT',
    headers: buildAuthHeaders(user, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status: newStatus })
  });
  const result = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    message: result?.message,
    data: result?.data,
  };
}

export async function getUsersApi() {
  const response = await fetch(`${API_BASE}/api/v1/admin/users`);
  const result = await response.json();
  return result;
}

export async function createUserByAdminApi(payload, user) {
  const response = await fetch(`${API_BASE}/api/v1/admin/users`, {
    method: 'POST',
    headers: buildAuthHeaders(user, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  return { ok: response.ok, data: result };
}

export async function deleteUserByAdminApi(userId, user) {
  const response = await fetch(`${API_BASE}/api/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(user),
  });
  const result = await response.json().catch(() => ({}));
  return { ok: response.ok, data: result };
}

export async function getAuditLogsApi() {
  const response = await fetch(`${API_BASE}/api/v1/admin/audit-logs`);
  const result = await response.json().catch(() => ({}));
  return { ok: response.ok, data: result };
}

// Helper: Tạo đường dẫn đầy đủ cho ảnh từ server
export function getImageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
}

// ===== DIARY =====

export async function createDiaryApi(data, user) {
  const response = await fetch(`${API_BASE}/api/v1/farmer/diary`, {
    method: 'POST',
    headers: buildAuthHeaders(user, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  });
  const result = await response.json();
  return { ok: response.ok, data: result };
}

export async function getDiariesApi(user) {
  const response = await fetch(`${API_BASE}/api/v1/farmer/diary`, {
    headers: buildAuthHeaders(user),
  });
  const result = await response.json();
  return result;
}

// ===== SETTINGS =====

export async function changeFullNameApi(userId, newFullName) {
  const response = await fetch(`${API_BASE}/api/v1/users/settings/name`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, newFullName })
  });
  const result = await response.json();
  return { ok: response.ok, data: result };
}

export async function changeEmailApi(userId, newEmail) {
  const response = await fetch(`${API_BASE}/api/v1/users/settings/email`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, newEmail })
  });
  const result = await response.json();
  return { ok: response.ok, data: result };
}

export async function changePasswordApi(userId, newPassword) {
  const response = await fetch(`${API_BASE}/api/v1/users/settings/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, newPassword })
  });
  const result = await response.json();
  return { ok: response.ok, data: result };
}

export async function deleteAccountApi(userId) {
  const response = await fetch(`${API_BASE}/api/v1/users/settings/account/${userId}`, {
    method: 'DELETE'
  });
  const result = await response.json();
  return { ok: response.ok, data: result };
}

// ===== 2FA =====

export async function get2FASetupApi(userId) {
  const response = await fetch(`${API_BASE}/api/v1/users/2fa/setup?userId=${userId}`);
  const result = await response.json();
  return { ok: response.ok, data: result };
}

export async function enable2FAApi(userId, token) {
  const response = await fetch(`${API_BASE}/api/v1/users/2fa/enable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, token }),
  });
  const result = await response.json();
  return { ok: response.ok, data: result };
}

export async function disable2FAApi(userId, token) {
  const response = await fetch(`${API_BASE}/api/v1/users/2fa/disable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, token }),
  });
  const result = await response.json();
  return { ok: response.ok, data: result };
}
