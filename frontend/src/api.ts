const base = import.meta.env.VITE_API_URL || "/api";
async function request(path: string, options: any = {}): Promise<any> {
  const token = sessionStorage.getItem("tripti-admin-token"),
    isForm = options.body instanceof FormData;
  const headers = {
    ...options.headers,
    ...(options.body && !isForm ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(`${base}${path}`, { ...options, headers });
  let data: any = {};
  try {
    data = await response.json();
  } catch {}
  if (!response.ok) throw new Error(data.message || "অনুরোধটি সম্পন্ন হয়নি");
  return data;
}
export const api = {
  products: () => request("/products"),
  settings: () => request("/settings"),
  createOrder: (data: any) =>
    request("/orders", { method: "POST", body: JSON.stringify(data) }),
  lookupOrder: (data: any) => request("/orders/lookup", { method: "POST", body: JSON.stringify(data) }),
  reviews: (productId: string) => request(`/reviews?productId=${encodeURIComponent(productId)}`),
  createReview: (data: any) => request("/reviews", { method: "POST", body: JSON.stringify(data) }),
  login: (data: any) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  changePassword: (data: any) =>
    request("/auth/password", { method: "PUT", body: JSON.stringify(data) }),
  orders: () => request("/admin/orders"),
  adminReviews: () => request("/admin/reviews"),
  approveReview: (id: string, approved: boolean) => request(`/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ approved }) }),
  deleteReview: (id: string) => request(`/admin/reviews/${id}`, { method: "DELETE" }),
  adminProducts: () => request("/admin/products"),
  uploadImage: (file: File) => {
    const body = new FormData();
    body.append("image", file);
    return request("/admin/uploads/images", { method: "POST", body });
  },
  createProduct: (data: any) =>
    request("/admin/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) =>
    request(`/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: string) => request(`/admin/products/${id}`, { method: "DELETE" }),
  updateOrder: (id: string, status: string) =>
    request(`/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  verifyPayment: (id: string, paymentVerified: boolean) =>
    request(`/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ paymentVerified }),
    }),
  saveCourier: (id: string, courier: any) =>
    request(`/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ courier }),
    }),
  updateSettings: (data: any) =>
    request("/admin/settings", { method: "PUT", body: JSON.stringify(data) }),
};
