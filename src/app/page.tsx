// src/app/page.tsx
import HomeCatalogPanel from "@/components/catalog/HomeCatalogPanel";
import HeroSlider from "@/components/HeroSlider";
import BrandCarousel from "@/components/BrandCarousel";
import { getTangoBrands } from "@/lib/products-tango";

export const revalidate = 60; // revalidar la lista de marcas cada 60s (opcional)

export default async function HomePage() {
    // Traemos marcas (solo lo necesario para el panel)
    const brands = await getTangoBrands();

    return (
        <>
            {/* Hero Slider - Full Width */}
            <div className="w-full">
                <HeroSlider />
            </div>

            {/* Panel de Catálogo oculto - solo mantenemos la funcionalidad */}
            <div className="hidden">
                <HomeCatalogPanel brands={brands} />
            </div>

            {/* Brand Carousel - Full Width */}
            <div className="w-full bg-white py-12">
                <BrandCarousel brands={brands} />
            </div>
        </>
    );
}
