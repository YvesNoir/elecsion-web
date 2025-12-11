import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.elecsion.com'

  // URLs estáticas principales
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/catalogo`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    // Obtener todas las marcas activas con productos activos
    const brands = await prisma.brand.findMany({
      where: {
        isActive: true,
        products: {
          some: {
            isActive: true,
            isDeleted: false
          }
        }
      },
      select: {
        slug: true,
        createdAt: true,
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                isDeleted: false
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Generar URLs por marca
    const brandRoutes: MetadataRoute.Sitemap = brands.map((brand) => ({
      url: `${baseUrl}/catalogo?brand=${brand.slug}`,
      lastModified: brand.createdAt,
      changeFrequency: 'weekly' as const,
      priority: brand._count.products > 50 ? 0.8 : 0.6, // Prioridad más alta para marcas con más productos
    }))

    // Obtener productos destacados o más recientes (limitamos para no hacer el sitemap muy grande)
    const featuredProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        isDeleted: false,
        OR: [
          { isFeatured: true },
          { updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // Productos actualizados en los últimos 30 días
        ]
      },
      select: {
        sku: true,
        updatedAt: true,
        brand: {
          select: {
            slug: true
          }
        }
      },
      take: 500, // Limitamos a 500 productos para no saturar el sitemap
      orderBy: [
        { isFeatured: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    // Generar URLs de productos (usando SKU si está disponible)
    const productRoutes: MetadataRoute.Sitemap = featuredProducts
      .filter(product => product.sku) // Solo productos con SKU
      .map((product) => ({
        url: `${baseUrl}/catalogo?brand=${product.brand?.slug}&search=${encodeURIComponent(product.sku!)}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.4,
      }))

    // Combinar todas las rutas
    return [...staticRoutes, ...brandRoutes, ...productRoutes]

  } catch (error) {
    console.error('Error generating sitemap:', error)
    // En caso de error, devolver solo las rutas estáticas
    return staticRoutes
  }
}
