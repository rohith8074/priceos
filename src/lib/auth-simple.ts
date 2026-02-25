export const AUTH_COOKIE_NAME = 'priceos-session';

export function getSession() {
    if (typeof window === 'undefined') return null;
    const cookies = document.cookie.split(';');
    const session = cookies.find(c => c.trim().startsWith(`${AUTH_COOKIE_NAME}=`));
    return session ? JSON.parse(decodeURIComponent(session.split('=')[1])) : null;
}

export function setSession(user: any) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7); // 7 days
    document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(user))}; path=/; expires=${expiry.toUTCString()}`;
}

export function clearSession() {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
