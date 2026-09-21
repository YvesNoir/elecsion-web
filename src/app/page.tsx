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
        <div className="relative left-1/2 -mt-20 flex min-h-[100svh] w-screen -translate-x-1/2 flex-col md:-mt-[84px]">
            {/* Hero Slider - Full Width */}
            <div className="w-full flex-1">
                <HeroSlider className="h-[calc(100svh-160px)] min-h-[500px] rounded-none shadow-none" />
            </div>

            {/* Panel de Catálogo oculto - solo mantenemos la funcionalidad */}
            <div className="hidden">
                <HomeCatalogPanel brands={brands} />
            </div>

            {/* Brand Carousel - Full Width */}
            <div className="w-full flex-none bg-white py-8">
                <BrandCarousel brands={brands} />
            </div>
        </div>
    );
}
