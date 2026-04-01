const TOKEN_KEY = "rb_token";
const USER_KEY = "rb_user";

export const saveAuth = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getUser = () => {
  const value = localStorage.getItem(USER_KEY);
  return value ? JSON.parse(value) : null;
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);
