import { jwtDecode } from 'jwt-decode';

export function getStoredToken() {
  return localStorage.getItem('token');
}

export function isTokenExpired(token) {
  try {
    const { exp } = jwtDecode(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

export function decodeToken(token) {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}
