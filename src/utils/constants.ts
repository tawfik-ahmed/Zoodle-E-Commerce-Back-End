export const CURRENT_TIMESTAMP = 'CURRENT_TIMESTAMP(6)';
export const FRONTEND_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://zoodle-eco.vercel.app'
    : 'http://localhost:5000';
export const BACKEND_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://zoodle-e-commerce-back-end.onrender.com'
    : 'http://localhost:3000';
