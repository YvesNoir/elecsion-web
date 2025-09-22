import { NextRequest, NextResponse } from "next/server";

interface ExchangeRate {
    currency: string;
    buy: number;
    sell: number;
    lastUpdated: string;
}

async function fetchBNARate(): Promise<ExchangeRate> {
    const response = await fetch('https://www.bna.com.ar/Cotizador/MonedasHistorico', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Buscar la tabla con las cotizaciones
    const dollarPattern = /Dolar U\.S\.A\.\s*<\/td>\s*<td[^>]*>\s*([\d,]+\.?\d*)\s*<\/td>\s*<td[^>]*>\s*([\d,]+\.?\d*)\s*<\/td>/i;
    const match = html.match(dollarPattern);

    if (!match) {
        // Patrón alternativo más flexible
        const alternativePattern = /(?:Dolar|Dólar).*?U\.?S\.?A\.?.*?<\/td>.*?<td[^>]*>\s*([\d,]+\.?\d*)\s*<\/td>\s*<td[^>]*>\s*([\d,]+\.?\d*)\s*<\/td>/is;
        const altMatch = html.match(alternativePattern);
        
        if (!altMatch) {
            throw new Error('No se pudo encontrar la cotización del dólar en el HTML');
        }
        
        const buyRate = parseFloat(altMatch[1].replace(',', '.'));
        const sellRate = parseFloat(altMatch[2].replace(',', '.'));

        return {
            currency: 'USD',
            buy: buyRate,
            sell: sellRate,
            lastUpdated: new Date().toISOString()
        };
    }

    // Convertir strings a números (manejar formato argentino con comas)
    const buyRate = parseFloat(match[1].replace(',', '.'));
    const sellRate = parseFloat(match[2].replace(',', '.'));

    return {
        currency: 'USD',
        buy: buyRate,
        sell: sellRate,
        lastUpdated: new Date().toISOString()
    };
}

export async function POST(request: NextRequest) {
    try {
        console.log('🔄 Forzando actualización manual de cotización BNA...');
        const exchangeRate = await fetchBNARate();
        console.log('✅ Cotización obtenida:', exchangeRate);
        
        return NextResponse.json({
            success: true,
            message: 'Cotización actualizada exitosamente',
            data: exchangeRate
        });

    } catch (error) {
        console.error('❌ Error forzando actualización de cotización:', error);
        
        return NextResponse.json({
            success: false,
            error: 'Error al actualizar la cotización',
            message: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        console.log('🔄 Forzando actualización manual de cotización BNA...');
        const exchangeRate = await fetchBNARate();
        console.log('✅ Cotización obtenida:', exchangeRate);
        
        return NextResponse.json({
            success: true,
            message: 'Cotización actualizada exitosamente',
            data: exchangeRate
        });

    } catch (error) {
        console.error('❌ Error forzando actualización de cotización:', error);
        
        return NextResponse.json({
            success: false,
            error: 'Error al actualizar la cotización',
            message: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
}