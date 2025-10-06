/**
 * Sanitiza un SKU para poder ser usado como nombre de archivo de imagen
 * Convierte a minúsculas y remueve caracteres problemáticos manteniendo guiones
 */
export function sanitizeSkuForFilename(sku: string): string {
    if (!sku) return '';
    
    return sku
        .trim()
        .toLowerCase()
        // Reemplazar / con nada
        .replace(/\//g, '')
        // Remover otros caracteres problemáticos pero mantener guiones
        .replace(/[\\:*?"<>|\s]/g, '')
        // Mantener solo caracteres alfanuméricos y guiones
        .replace(/[^a-z0-9-]/g, '');
}

/**
 * Genera la URL de la imagen de un producto basado en su SKU
 * Intenta PNG primero, luego JPG, finalmente placeholder
 */
export function getProductImageUrl(sku: string): string {
    const sanitizedSku = sanitizeSkuForFilename(sku);
    return sanitizedSku
        ? `/product-images/${sanitizedSku}.png`
        : `/product-images/placeholder.png`;
}

/**
 * Genera múltiples URLs de imagen para un SKU (para fallback)
 */
export function getProductImageUrls(sku: string): string[] {
    const sanitizedSku = sanitizeSkuForFilename(sku);
    if (!sanitizedSku) {
        return ['/product-images/placeholder.png'];
    }
    
    return [
        `/product-images/${sanitizedSku}.png`,
        `/product-images/${sanitizedSku}.jpg`,
        `/product-images/${sanitizedSku}.jpeg`,
        '/product-images/placeholder.png'
    ];
}