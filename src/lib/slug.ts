export function slugify(input: string) {
    return input
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // sin acentos
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

export function unslugify(slug: string) {
    return slug.replace(/-/g, " ").trim();
}