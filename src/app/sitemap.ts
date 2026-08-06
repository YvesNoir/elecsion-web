import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'
import { getTangoBrands, TANGO_WEB_PRICE_LIST_CODE } from '@/lib/products-tango'

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
    const brands = await getTangoBrands()

    // Generar URLs por marca
    const brandRoutes: MetadataRoute.Sitemap = brands.map((brand) => ({
      url: `${baseUrl}/catalogo?brand=${brand.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: brand._count.products > 50 ? 0.8 : 0.6,
    }))

    // Obtener productos destacados o más recientes (limitamos para no hacer el sitemap muy grande)
    const featuredProducts = await prisma.productsTango.findMany({
      where: {
        priceListCode: TANGO_WEB_PRICE_LIST_CODE,
        isActive: true,
      },
      select: {
        articleCode: true,
        synonym: true,
        updatedAt: true,
        brandName: true,
      },
      take: 500, // Limitamos a 500 productos para no saturar el sitemap
      orderBy: { updatedAt: 'desc' }
    })

    // Generar URLs de productos (usando SKU si está disponible)
    const productRoutes: MetadataRoute.Sitemap = featuredProducts
      .map((product) => ({
        url: `${baseUrl}/producto/${encodeURIComponent(product.articleCode)}`,
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
