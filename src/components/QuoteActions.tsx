"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type QuoteActionsProps = {
    quoteId: string;
    status: string;
};

export default function QuoteActions({ quoteId, status }: QuoteActionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleCancelQuote = async () => {
        if (!confirm("¿Estás seguro de que quieres cancelar esta cotización?")) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/orders/cancel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ orderId: quoteId }),
            });

            const result = await response.json();

            if (response.ok) {
                alert("✅ Cotización cancelada exitosamente");
                router.refresh(); // Recargar la página para mostrar cambios
            } else {
                alert(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error al cancelar cotización:", error);
            alert("❌ Error al cancelar la cotización. Intenta nuevamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const canCancel = ['DRAFT', 'SUBMITTED'].includes(status) && status !== 'CANCELLED';

    if (!canCancel) return null;

    return (
        <button
            onClick={handleCancelQuote}
            disabled={isLoading}
            className="text-red-600 hover:underline disabled:opacity-50"
        >
            {isLoading ? "Cancelando..." : "Cancelar"}
        </button>
    );
}