"use client";

type Props = {
    productId: string;
    name: string;
    price: number;   // numérico (fallback LS)
    qty?: number;
    className?: string;  // reutilizamos el mismo estilo que "Ver detalle"
    label?: string;
};

const LS_KEY = "elecsion_cart";

export default function AddToCartLink({
                                          productId,
                                          name,
                                          price,
                                          qty = 1,
                                          className,
                                          label = "Agregar al carrito",
                                      }: Props) {

    function notifyAll() {
        // para que el badge y el dropdown se refresquen
        window.dispatchEvent(new Event("cart:changed"));
        window.dispatchEvent(new CustomEvent("cart:updated"));
    }

    function addToLocalStorage() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            const items: any[] = raw ? JSON.parse(raw) : [];
            const i = items.findIndex((it) => it.productId === productId);
            if (i >= 0) {
                items[i].qty = (items[i].qty || 0) + qty;
                items[i].price = price;
            } else {
                items.push({ productId, name, price, qty });
            }
            localStorage.setItem(LS_KEY, JSON.stringify(items));
            notifyAll();
        } catch { /* noop */ }
    }

    async function addToServer() {
        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
                body: JSON.stringify({ productId, quantity: qty }),
            });

            if (res.ok) { notifyAll(); return; }
            if (res.status === 401) { addToLocalStorage(); return; }

            const data = await res.json().catch(() => ({}));
            alert(data?.error || "No se pudo agregar al carrito.");
        } catch {
            alert("Ocurrió un error al agregar el producto.");
        }
    }

    async function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
        e.preventDefault(); // NO navegamos, solo agregamos
        await addToServer();
    }

    return (
        <a
            href="#"
            onClick={handleClick}
            className={
                className ??
                // mismo look & feel que "Ver detalle"
                "inline-flex h-8 items-center rounded-md border border-[#B5B5B5]/60 px-3 text-sm text-[#1C1C1C] hover:bg-[#f5f5f7] whitespace-nowrap"
            }
            aria-label={label}
            title={label}
            role="button"
        >
            {label}
        </a>
    );
}