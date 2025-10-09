# Configuración de Email para Vercel

## Problema
Los emails funcionan en localhost pero no en Vercel porque faltan las variables de entorno SMTP.

## Variables de entorno requeridas en Vercel

Ir a **Vercel Dashboard > Project Settings > Environment Variables** y agregar:

```
SMTP_HOST=sd-1358901-l.dattaweb.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=catalogo@elecsion.com
SMTP_PASSWORD=CataElec1666*
FROM_EMAIL=catalogo@elecsion.com
NEXT_PUBLIC_BASE_URL=https://elecsion-web.vercel.app
```

## Explicación de cada variable

- **SMTP_HOST**: Servidor SMTP de Ferozo (Dattaweb)
- **SMTP_PORT**: Puerto 465 para SSL/TLS
- **SMTP_SECURE**: `true` porque usa SSL en puerto 465
- **SMTP_USER**: Usuario del email (catalogo@elecsion.com)
- **SMTP_PASSWORD**: Contraseña del email
- **FROM_EMAIL**: Email desde el cual se envían las notificaciones
- **NEXT_PUBLIC_BASE_URL**: URL base para los enlaces en los emails

## Después de configurar

1. Agregar todas las variables en Vercel
2. Hacer redeploy del proyecto
3. Probar creando un pedido desde la web en producción
4. Verificar que lleguen los emails

## Archivos involucrados

- `/src/lib/email.ts` - Configuración de Nodemailer
- `/src/app/api/orders/route.ts` - Envío de emails al crear pedidos
- `/src/app/api/orders/quote/route.ts` - Envío de emails para cotizaciones

## Templates de email disponibles

- `quoteCreatedForClient` - Email al cliente cuando crea cotización
- `quoteCreatedForSellers` - Email a vendedores/admins sobre nueva cotización
- `orderCreatedForClient` - Email al cliente cuando crea pedido
- `orderCreatedForSellers` - Email a vendedores/admins sobre nuevo pedido
- `orderApproved` - Email al cliente cuando se aprueba pedido
- `orderCanceled` - Email al cliente cuando se cancela pedido