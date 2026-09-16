const base = import.meta.env.VITE_API_URL || "/api";
async function request(path, options = {}) {
  const token = sessionStorage.getItem("tripti-admin-token"),
    isForm = options.body instanceof FormData;
  const headers = {
    ...options.headers,
    ...(options.body && !isForm ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(`${base}${path}`, { ...options, headers });
  let data = {};
  try {
    data = await response.json();
  } catch {}
  if (!response.ok) throw new Error(data.message || "অনুরোধটি সম্পন্ন হয়নি");
  return data;
}
export const api = {
  products: () => request("/products"),
  settings: () => request("/settings"),
  createOrder: (data) =>
    request("/orders", { method: "POST", body: JSON.stringify(data) }),
  lookupOrder: (data) => request("/orders/lookup", { method: "POST", body: JSON.stringify(data) }),
  reviews: (productId) => request(`/reviews?productId=${encodeURIComponent(productId)}`),
  createReview: (data) => request("/reviews", { method: "POST", body: JSON.stringify(data) }),
  login: (data) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  changePassword: (data) =>
    request("/auth/password", { method: "PUT", body: JSON.stringify(data) }),
  orders: () => request("/admin/orders"),
  adminReviews: () => request("/admin/reviews"),
  approveReview: (id, approved) => request(`/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ approved }) }),
  deleteReview: (id) => request(`/admin/reviews/${id}`, { method: "DELETE" }),
  adminProducts: () => request("/admin/products"),
  uploadImage: (file) => {
    const body = new FormData();
    body.append("image", file);
    return request("/admin/uploads/images", { method: "POST", body });
  },
  createProduct: (data) =>
    request("/admin/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id, data) =>
    request(`/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: "DELETE" }),
  updateOrder: (id, status) =>
    request(`/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  verifyPayment: (id, paymentVerified) =>
    request(`/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ paymentVerified }),
    }),
  saveCourier: (id, courier) =>
    request(`/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ courier }),
    }),
  updateSettings: (data) =>
    request("/admin/settings", { method: "PUT", body: JSON.stringify(data) }),
};
