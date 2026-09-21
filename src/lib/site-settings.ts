export const PORTAL_CLIENTS_URL_KEY = "portal_clients_url";

export function normalizePortalClientsUrl(input: unknown): string | null {
    if (typeof input !== "string") return null;

    const value = input.trim();
    if (!value) return null;

    if (value.startsWith("/")) return null;

    try {
        const hasProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(value);
        const normalizedValue = hasProtocol ? value : `https://${value}`;
        const parsed = new URL(normalizedValue);
        if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || !parsed.hostname) return null;
        return normalizedValue;
    } catch {
        return null;
    }
}
