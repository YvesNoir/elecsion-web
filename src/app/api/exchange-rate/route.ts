import { NextResponse } from "next/server";

interface ExchangeRate {
    currency: string;
    buy: number;
    sell: number;
    lastUpdated: string;
}

export async function GET() {
    try {
        // Obtener la página del BNA
        const response = await fetch('https://www.bna.com.ar/Cotizador/MonedasHistorico', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            // Cache por 5 minutos
            next: { revalidate: 300 }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        
        // Buscar la tabla con las cotizaciones
        // Patrón para encontrar la fila del Dólar U.S.A.
        const dollarPattern = /Dolar U\.S\.A\.\s*<\/td>\s*<td[^>]*>\s*([\d,]+\.?\d*)\s*<\/td>\s*<td[^>]*>\s*([\d,]+\.?\d*)\s*<\/td>/i;
        const match = html.match(dollarPattern);

        if (!match) {
            // Patrón alternativo más flexible
            const alternativePattern = /(?:Dolar|Dólar).*?U\.?S\.?A\.?.*?<\/td>.*?<td[^>]*>\s*([\d,]+\.?\d*)\s*<\/td>\s*<td[^>]*>\s*([\d,]+\.?\d*)\s*<\/td>/is;
            const altMatch = html.match(alternativePattern);
            
            if (!altMatch) {
                console.error('No se pudo encontrar la cotización del dólar en el HTML');
                return NextResponse.json({ 
                    error: "No se pudo obtener la cotización" 
                }, { status: 500 });
            }
            
            const buyRate = parseFloat(altMatch[1].replace(',', '.'));
            const sellRate = parseFloat(altMatch[2].replace(',', '.'));

            const exchangeRate: ExchangeRate = {
                currency: 'USD',
                buy: buyRate,
                sell: sellRate,
                lastUpdated: new Date().toISOString()
            };

            return NextResponse.json(exchangeRate);
        }

        // Convertir strings a números (manejar formato argentino con comas)
        const buyRate = parseFloat(match[1].replace(',', '.'));
        const sellRate = parseFloat(match[2].replace(',', '.'));

        const exchangeRate: ExchangeRate = {
            currency: 'USD',
            buy: buyRate,
            sell: sellRate,
            lastUpdated: new Date().toISOString()
        };

        return NextResponse.json(exchangeRate);

    } catch (error) {
        console.error('Error obteniendo cotización del BNA:', error);
        
        // Devolver valores de respaldo en caso de error
        const fallbackRate: ExchangeRate = {
            currency: 'USD',
            buy: 1465.50,
            sell: 1474.50,
            lastUpdated: new Date().toISOString()
        };

        return NextResponse.json(fallbackRate);
    }
}