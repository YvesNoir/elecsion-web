import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

interface ExchangeRateData {
    currency: string;
    buy: number;
    sell: number;
    lastUpdated: string;
}

export class ExchangeRateService {
    constructor() {
        // Usamos la instancia compartida de Prisma
    }

    async fetchFromBNA(): Promise<ExchangeRateData> {
        try {
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

        } catch (error) {
            console.error('Error obteniendo cotización del BNA:', error);
            throw error;
        }
    }

    async updateExchangeRate(): Promise<ExchangeRateData> {
        try {
            const bnaData = await this.fetchFromBNA();
            
            // Guardar o actualizar en la base de datos
            await prisma.exchangeRate.upsert({
                where: {
                    currency_source: {
                        currency: 'USD',
                        source: 'BNA'
                    }
                },
                update: {
                    buy: new Prisma.Decimal(bnaData.buy),
                    sell: new Prisma.Decimal(bnaData.sell),
                    fetchedAt: new Date(),
                    isActive: true
                },
                create: {
                    currency: 'USD',
                    buy: new Prisma.Decimal(bnaData.buy),
                    sell: new Prisma.Decimal(bnaData.sell),
                    source: 'BNA',
                    fetchedAt: new Date(),
                    isActive: true
                }
            });

            console.log(`Cotización USD actualizada: Compra: $${bnaData.buy}, Venta: $${bnaData.sell}`);
            return bnaData;

        } catch (error) {
            console.error('Error actualizando cotización:', error);
            throw error;
        }
    }

    async getCurrentRate(): Promise<ExchangeRateData | null> {
        try {
            const dbRate = await prisma.exchangeRate.findUnique({
                where: {
                    currency_source: {
                        currency: 'USD',
                        source: 'BNA'
                    }
                }
            });

            if (!dbRate) {
                return null;
            }

            return {
                currency: dbRate.currency,
                buy: parseFloat(dbRate.buy.toString()),
                sell: parseFloat(dbRate.sell.toString()),
                lastUpdated: dbRate.fetchedAt.toISOString()
            };

        } catch (error) {
            console.error('Error obteniendo cotización de BD:', error);
            return null;
        }
    }

    async getCurrentRateOrFetch(): Promise<ExchangeRateData> {
        const currentRate = await this.getCurrentRate();
        
        if (!currentRate) {
            // Si no hay datos en BD, buscar y guardar
            return await this.updateExchangeRate();
        }

        const now = new Date();
        const lastUpdate = new Date(currentRate.lastUpdated);
        const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

        // Si han pasado más de 4 horas, actualizar
        if (hoursDiff > 4) {
            try {
                return await this.updateExchangeRate();
            } catch (error) {
                // Si falla la actualización, devolver el último valor conocido
                console.warn('Fallo actualización, usando último valor conocido:', error);
                return currentRate;
            }
        }

        return currentRate;
    }

    isBusinessHours(): boolean {
        const now = new Date();
        const argTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
        
        // Lunes a Viernes (1-5), 10:00 a 16:00
        const dayOfWeek = argTime.getDay();
        const hour = argTime.getHours();
        
        return dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 10 && hour <= 16;
    }

    shouldUpdateNow(): boolean {
        const argTime = new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"});
        const currentTime = new Date(argTime);
        
        const hour = currentTime.getHours();
        const minute = currentTime.getMinutes();
        const dayOfWeek = currentTime.getDay();
        
        // Solo lunes a viernes
        if (dayOfWeek < 1 || dayOfWeek > 5) {
            return false;
        }
        
        // 10:30 (después de que BNA actualice a las 10:00)
        if (hour === 10 && minute >= 30) {
            return true;
        }
        
        // 15:30 (después de que BNA actualice a las 15:00)
        if (hour === 15 && minute >= 30) {
            return true;
        }
        
        return false;
    }

    async cleanup() {
        await prisma.$disconnect();
    }
}

// Función helper para usar sin instanciar la clase
export const exchangeRateService = new ExchangeRateService();