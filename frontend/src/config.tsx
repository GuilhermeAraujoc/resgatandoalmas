/** Public presentation settings. Never put API keys or database credentials here. */
export const config = {
  apiUrl: (import.meta.env?.VITE_API_URL || "http://localhost:3001/api").replace(/\/$/, ""),
  whatsappNumber: "", // Example format: 5591999999999. Leave empty until the company supplies it.
};
