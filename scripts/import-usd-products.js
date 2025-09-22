const XLSX = require('xlsx');
const path = require('path');

async function importUSDProducts() {
    try {
        // Simular el procesamiento que haría el ExcelImporter
        const filePath = path.join(__dirname, '../products-xlsx/lista-productos-final-en-dolar.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON manteniendo la primera fila como encabezados
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('=== PROCESANDO PRODUCTOS PARA IMPORTACIÓN ===');
        
        const mappedData = [];
        
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
            
            mappedData.push(product);
        }
        
        console.log(`\n=== RESUMEN DE PRODUCTOS PROCESADOS ===`);
        const usdProducts = mappedData.filter(p => p.currency === 'USD');
        const arsProducts = mappedData.filter(p => p.currency === 'ARS');
        
        console.log(`Total productos: ${mappedData.length}`);
        console.log(`Productos en USD: ${usdProducts.length}`);
        console.log(`Productos en ARS: ${arsProducts.length}`);
        
        console.log(`\n=== PRODUCTOS EN USD (primeros 10) ===`);
        usdProducts.slice(0, 10).forEach(product => {
            console.log(`- ${product.codigo}: ${product.descripcion} - U$S ${product.price}`);
        });
        
        console.log(`\n=== PRODUCTOS EN ARS (primeros 5) ===`);
        arsProducts.slice(0, 5).forEach(product => {
            console.log(`- ${product.codigo}: ${product.descripcion} - $ ${product.price}`);
        });
        
        return mappedData;
        
    } catch (error) {
        console.error('Error procesando archivo:', error);
        return [];
    }
}

importUSDProducts();