const XLSX = require('xlsx');
const path = require('path');

// Leer el archivo Excel
const workbook = XLSX.readFile(path.join(__dirname, '../referencias-imagenes/lista-productos-sica.xlsx'));
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convertir a JSON
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('=== ESTRUCTURA DEL ARCHIVO EXCEL ===');
console.log('Nombre de la hoja:', sheetName);
console.log('Total de filas:', jsonData.length);

if (jsonData.length > 0) {
    console.log('\n=== ENCABEZADOS (Primera fila) ===');
    console.log(jsonData[0]);
    
    console.log('\n=== PRIMERA FILA DE DATOS (Segunda fila) ===');
    if (jsonData.length > 1) {
        console.log(jsonData[1]);
    }
    
    console.log('\n=== PRIMERAS 3 FILAS COMPLETAS ===');
    jsonData.slice(0, 3).forEach((row, index) => {
        console.log(`Fila ${index}:`, row);
    });
}