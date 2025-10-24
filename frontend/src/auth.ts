export function saveToken(t: string) {
  localStorage.setItem("token", t);
}
export function loadToken(): string | null {
  return localStorage.getItem("token");
}
export function clearToken() {
  localStorage.removeItem("token");
}
