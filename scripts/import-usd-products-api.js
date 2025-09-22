const XLSX = require('xlsx');
const path = require('path');

async function importUSDProductsToAPI() {
    try {
        // Procesar archivo Excel
        const filePath = path.join(__dirname, '../products-xlsx/lista-productos-final-en-dolar.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('=== PROCESANDO PRODUCTOS PARA IMPORTACIÓN VIA API ===');
        
        const products = [];
        
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Saltar filas vacías
            if (!row || row.length === 0 || !row[0]) continue;
            
            // Detectar moneda basándose en la columna Currency
            let currency = 'ARS'; // Por defecto pesos argentinos
            const currencyValue = row[3]; // Columna Currency (posición 3)
            
            // Convertir a string y normalizar
            const currencyStr = String(currencyValue || '').trim().toUpperCase();
            
            if (currencyStr === 'U$S' || currencyStr === 'USD' || currencyStr === '$USD' || currencyStr === 'DOLLAR' || currencyStr === 'DOLAR') {
                currency = 'USD';
            } else if (currencyStr === '$' || currencyStr === 'ARS' || currencyStr === '$ARS' || currencyStr === 'PESO' || currencyStr === 'PESOS') {
                currency = 'ARS';
            } else if (!currencyStr || currencyStr === 'UNDEFINED') {
                // Si viene del archivo "dolar", probablemente son USD
                // Verificar si tiene precios que parecen ser USD (generalmente más bajos que ARS)
                const price = parseFloat(row[4]) || 0;
                const precioEnPesos = parseFloat(row[10]) || 0;
                
                // Si precio en pesos es significativamente mayor que el precio base, probablemente el base está en USD
                if (precioEnPesos > price * 100) {
                    currency = 'USD';
                    console.log(`Detectado USD por precio: ${price} vs ${precioEnPesos} para ${row[1]}`);
                } else {
                    currency = 'ARS';
                }
            }

            const product = {
                codigo: row[0], // Código
                descripcion: row[1] || '', // Descripción
                familia: row[5] || '', // Familia
                price: parseFloat(row[4]) || 0, // Price
                stock: parseFloat(row[9]) || 0, // Stock
                iva: parseFloat(row[6]) || 21, // IVA (por defecto 21%)
                currency: currency, // Moneda detectada
            };
            
            products.push(product);
        }
        
        console.log(`\n=== RESUMEN DE PRODUCTOS PROCESADOS ===`);
        const usdProducts = products.filter(p => p.currency === 'USD');
        const arsProducts = products.filter(p => p.currency === 'ARS');
        
        console.log(`Total productos: ${products.length}`);
        console.log(`Productos en USD: ${usdProducts.length}`);
        console.log(`Productos en ARS: ${arsProducts.length}`);
        
        // Hacer la llamada a la API
        console.log(`\n=== ENVIANDO PRODUCTOS A LA API ===`);
        
        const response = await fetch('http://localhost:3000/api/productos/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Nota: En producción necesitaríamos enviar el token de sesión
            },
            body: JSON.stringify({ products })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        console.log(`\n=== RESULTADO DE LA IMPORTACIÓN ===`);
        console.log(`Total procesados: ${result.results.total}`);
        console.log(`Productos creados: ${result.results.created}`);
        console.log(`Productos actualizados: ${result.results.updated}`);
        console.log(`Errores: ${result.results.errors}`);
        
        if (result.results.errorDetails && result.results.errorDetails.length > 0) {
            console.log(`\n=== ERRORES ENCONTRADOS ===`);
            result.results.errorDetails.forEach(error => {
                console.log(`- ${error}`);
            });
        }
        
        console.log(`\n✅ Importación completada exitosamente!`);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error en importación:', error);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Sugerencia: Asegúrate de que el servidor Next.js esté ejecutándose en http://localhost:3000');
        }
        
        return null;
    }
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
    importUSDProductsToAPI();
}

module.exports = { importUSDProductsToAPI };