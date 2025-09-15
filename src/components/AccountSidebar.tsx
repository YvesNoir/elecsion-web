// src/components/AccountSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCart } from "@/store/cart";

type SidebarItem = {
    href: string;
    label: string;
    icon?: string;
    roles?: string[]; // Roles que pueden ver este item
};

const baseMenuItems: SidebarItem[] = [
    { href: "/mi-cuenta", label: "Mi Cuenta" },
    { href: "/mi-cuenta/perfil", label: "Perfil" },
];

const clientMenuItems: SidebarItem[] = [
    { href: "/mis-cotizaciones", label: "Mis Cotizaciones", roles: ["CLIENT"] },
    { href: "/pedidos-completados", label: "Pedidos Completados", roles: ["CLIENT"] },
];

const sellerMenuItems: SidebarItem[] = [
    { href: "/pedidos-pendientes", label: "Pedidos Pendientes", roles: ["SELLER"] },
    { href: "/pedidos-asignados", label: "Pedidos Asignados", roles: ["SELLER"] },
    { href: "/mis-clientes", label: "Mis Clientes", roles: ["SELLER"] },
];

const adminMenuItems: SidebarItem[] = [
    { href: "/mi-cuenta/productos", label: "Productos", roles: ["ADMIN"] },
    { href: "/usuarios", label: "Usuarios", roles: ["ADMIN"] },
    { href: "/pedidos-pendientes", label: "Pedidos Pendientes", roles: ["ADMIN"] },
    { href: "/pedidos-confirmados", label: "Pedidos Confirmados", roles: ["ADMIN"] },
    { href: "/reportes", label: "Reportes", roles: ["ADMIN"] },
];

export default function AccountSidebar() {
    const pathname = usePathname();
    const { clear } = useCart();
    const { data: session } = useSession();
    
    // Determinar qué items mostrar según el rol
    const userRole = session?.user?.role as string;
    let menuItems = [...baseMenuItems];
    
    if (userRole === "ADMIN") {
        menuItems = [...baseMenuItems, ...adminMenuItems];
    } else if (userRole === "SELLER") {
        menuItems = [...baseMenuItems, ...sellerMenuItems];
    } else if (userRole === "CLIENT") {
        menuItems = [...baseMenuItems, ...clientMenuItems];
    }

    const handleLogout = async () => {
        try {
            // Limpiar el carrito antes de cerrar sesión
            clear();
            await signOut({ callbackUrl: '/' });
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    return (
        <aside className="bg-white rounded-lg border border-[#B5B5B5]/40 p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#B5B5B5]/40 bg-[#F5F5F7]">
                <h2 className="text-base font-semibold text-[#1C1C1C]">Mi Cuenta</h2>
            </div>
            
            <nav className="py-2">
                <ul className="space-y-0">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center px-4 py-3 text-sm transition-colors hover:bg-[#F5F5F7] ${
                                        isActive 
                                            ? "bg-[#F5F5F7] text-[#1C1C1C] font-medium border-r-2 border-[#384A93]" 
                                            : "text-[#646464] hover:text-[#1C1C1C]"
                                    }`}
                                >
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
                
                <div className="mt-4 pt-4 border-t border-[#B5B5B5]/40">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm text-[#646464] hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
}