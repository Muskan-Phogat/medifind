/**
 * MediFind API Service Client
 * Handles requests, standard {error:{code,message}} extraction,
 * and friendly 429 rate limit notifications.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiError extends Error {
  constructor(message, code = 'API_ERROR', status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 429 Rate Limit Handling
    if (response.status === 429) {
      throw new ApiError(
        'You have made multiple quick requests. Please wait a moment before trying again.',
        'RATE_LIMITED',
        429
      );
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errCode = data?.error?.code || `HTTP_${response.status}`;
      const errMsg = data?.error?.message || response.statusText || 'An error occurred';
      throw new ApiError(errMsg, errCode, response.status);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or offline failure
    throw new ApiError(
      'Unable to connect to MediFind server. Please verify your internet or local backend server.',
      'NETWORK_ERROR',
      0
    );
  }
}

// --- Endpoints ---

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Medicines autocomplete
  suggestMedicines: (q) => request(`/medicines/suggest?q=${encodeURIComponent(q)}`),

  // Search
  searchPharmacies: ({ medicineId, lat, lng, radiusKm = 5.0, emergency = false }) => {
    const params = new URLSearchParams({
      medicine_id: medicineId,
      lat: lat.toString(),
      lng: lng.toString(),
      radius_km: radiusKm.toString(),
      emergency: emergency ? 'true' : 'false',
    });
    return request(`/search?${params.toString()}`);
  },

  // Auto-Ping
  triggerPing: (searchId) => request(`/search/${searchId}/ping`, { method: 'POST' }),

  getBatchStatus: (batchId) => request(`/pings/${batchId}/status`),

  replyToPing: (pingId, reply) =>
    request(`/pings/${pingId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    }),

  getPendingPings: (pharmacyId = null) => {
    const query = pharmacyId ? `?pharmacy_id=${pharmacyId}` : '';
    return request(`/pings/pending${query}`);
  },

  // Reservations
  createReservation: (payload) =>
    request('/reservations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getReservation: (id) => request(`/reservations/${id}`),

  updateReservationStatus: (id, status) =>
    request(`/reservations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Pharmacy Portal
  getPharmacies: () => request('/pharmacies'),

  loginPharmacy: (pharmacyId, pin) =>
    request('/pharmacy/login', {
      method: 'POST',
      body: JSON.stringify({ pharmacy_id: parseInt(pharmacyId, 10), pin }),
    }),

  getPharmacyDashboard: (pharmacyId, token) =>
    request(`/pharmacy/${pharmacyId}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updatePharmacyInventory: (pharmacyId, token, payload) =>
    request(`/pharmacy/${pharmacyId}/inventory`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  // Community Reports
  submitReport: (payload) =>
    request('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Unmet Demand Insights
  getUnmetDemand: (pharmacyId = null) => {
    const query = pharmacyId ? `?pharmacy_id=${pharmacyId}` : '';
    return request(`/insights/unmet-demand${query}`);
  },

  // Demo Reset
  resetDemo: (adminKey = 'medifind-demo-secret-2025') =>
    request('/demo/reset', {
      method: 'POST',
      body: JSON.stringify({ admin_key: adminKey }),
    }),
};
