/**
 * Generates a UUID v4 compliant string.
 * Necessary because crypto.randomUUID() is not always available in RN without polyfills,
 * and Supabase requires a valid UUID format for the ID column.
 */
export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
