const XLSX = require('xlsx');
const path = require('path');

function analyzeExcel() {
    try {
        // Leer el archivo Excel de productos en dólares
        const filePath = path.join(__dirname, '../products-xlsx/lista-productos-final-en-dolar.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON manteniendo la primera fila como encabezados
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('=== ANÁLISIS DEL ARCHIVO USD ===');
        console.log('Nombre de la hoja:', sheetName);
        console.log('Total de filas:', jsonData.length);
        
        if (jsonData.length > 0) {
            console.log('\n=== ENCABEZADOS (Fila 1) ===');
            const headers = jsonData[0];
            headers.forEach((header, index) => {
                console.log(`Columna ${index}: "${header}"`);
            });
            
            console.log('\n=== PRIMERAS 5 FILAS DE DATOS ===');
            for (let i = 1; i <= Math.min(5, jsonData.length - 1); i++) {
                const row = jsonData[i];
                console.log(`\nFila ${i}:`);
                headers.forEach((header, index) => {
                    console.log(`  ${header}: "${row[index] || 'N/A'}"`);
                });
            }
            
            console.log('\n=== ANÁLISIS DE MONEDA ===');
            let usdCount = 0;
            let arsCount = 0;
            let otherCount = 0;
            
            for (let i = 1; i < Math.min(50, jsonData.length); i++) {
                const row = jsonData[i];
                const currency = row[3]; // Columna Md.
                
                if (currency === 'U$S' || currency === 'USD' || currency === '$USD') {
                    usdCount++;
                } else if (currency === '$' || currency === 'ARS' || currency === '$ARS') {
                    arsCount++;
                } else {
                    otherCount++;
                    if (otherCount <= 5) {
                        console.log(`Moneda no reconocida en fila ${i}: "${currency}"`);
                    }
                }
            }
            
            console.log(`\nProductos analizados (primeros 50):`);
            console.log(`- USD: ${usdCount}`);
            console.log(`- ARS: ${arsCount}`);
            console.log(`- Otros: ${otherCount}`);
        }
        
    } catch (error) {
        console.error('Error analizando archivo Excel:', error);
    }
}

analyzeExcel();