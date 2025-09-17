"use client";

import { useSession } from "next-auth/react";
import CartDrawer from "./CartDrawer";

export default function CartDrawerWrapper() {
    const { data: session } = useSession();
    const isLoggedIn = !!session?.user;

    return <CartDrawer isLoggedIn={isLoggedIn} />;
}