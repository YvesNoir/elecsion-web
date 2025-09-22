import { NextRequest, NextResponse } from "next/server";
import cron from 'node-cron';

interface ExchangeRate {
    currency: string;
    buy: number;
    sell: number;
    lastUpdated: string;
}

// Almacenar las tareas programadas
let scheduledTasks: cron.ScheduledTask[] = [];

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

// Función para actualizar la cotización
async function updateExchangeRateTask() {
    try {
        console.log('⏰ Ejecutando actualización programada de cotización BNA...');
        const result = await fetchBNARate();
        console.log('✅ Cotización actualizada programada:', result);
    } catch (error) {
        console.error('❌ Error en actualización programada:', error);
    }
}

// Función para inicializar los cron jobs
function initializeScheduler() {
    // Limpiar tareas existentes
    scheduledTasks.forEach(task => task.destroy());
    scheduledTasks = [];

    // Programar para las 10:30 AM, lunes a viernes (zona horaria de Argentina)
    const morningTask = cron.schedule('30 10 * * 1-5', updateExchangeRateTask, {
        scheduled: false,
        timezone: "America/Argentina/Buenos_Aires"
    });

    // Programar para las 3:30 PM, lunes a viernes (zona horaria de Argentina)
    const afternoonTask = cron.schedule('30 15 * * 1-5', updateExchangeRateTask, {
        scheduled: false,
        timezone: "America/Argentina/Buenos_Aires"
    });

    scheduledTasks.push(morningTask, afternoonTask);

    // Iniciar las tareas
    morningTask.start();
    afternoonTask.start();

    console.log('📅 Scheduler BNA inicializado:');
    console.log('   - 10:30 AM (lunes a viernes) - Zona horaria: America/Argentina/Buenos_Aires');
    console.log('   - 15:30 PM (lunes a viernes) - Zona horaria: America/Argentina/Buenos_Aires');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const action = body.action;

        switch (action) {
            case 'start':
                initializeScheduler();
                return NextResponse.json({
                    success: true,
                    message: 'Scheduler iniciado exitosamente',
                    schedule: [
                        '10:30 AM (lunes a viernes)',
                        '15:30 PM (lunes a viernes)'
                    ]
                });

            case 'stop':
                scheduledTasks.forEach(task => task.destroy());
                scheduledTasks = [];
                return NextResponse.json({
                    success: true,
                    message: 'Scheduler detenido exitosamente'
                });

            case 'status':
                return NextResponse.json({
                    success: true,
                    running: scheduledTasks.length > 0,
                    taskCount: scheduledTasks.length,
                    schedule: scheduledTasks.length > 0 ? [
                        '10:30 AM (lunes a viernes)',
                        '15:30 PM (lunes a viernes)'
                    ] : []
                });

            case 'restart':
                scheduledTasks.forEach(task => task.destroy());
                scheduledTasks = [];
                initializeScheduler();
                return NextResponse.json({
                    success: true,
                    message: 'Scheduler reiniciado exitosamente'
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: 'Acción no válida. Use: start, stop, status, restart'
                }, { status: 400 });
        }

    } catch (error) {
        console.error('Error en scheduler:', error);
        return NextResponse.json({
            success: false,
            error: 'Error interno del servidor',
            message: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            running: scheduledTasks.length > 0,
            taskCount: scheduledTasks.length,
            schedule: scheduledTasks.length > 0 ? [
                '10:30 AM (lunes a viernes) - America/Argentina/Buenos_Aires',
                '15:30 PM (lunes a viernes) - America/Argentina/Buenos_Aires'
            ] : [],
            timezone: 'America/Argentina/Buenos_Aires',
            description: 'Actualización automática de cotización BNA a las 10:30 y 15:30, lunes a viernes'
        });
    } catch (error) {
        console.error('Error obteniendo status del scheduler:', error);
        return NextResponse.json({
            success: false,
            error: 'Error interno del servidor'
        }, { status: 500 });
    }
}

// Auto-inicializar el scheduler cuando se carga el módulo
if (process.env.NODE_ENV === 'production') {
    initializeScheduler();
}