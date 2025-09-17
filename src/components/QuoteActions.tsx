"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmationModal from "./ConfirmationModal";
import SuccessModal from "./SuccessModal";

type QuoteActionsProps = {
    quoteId: string;
    status: string;
};

export default function QuoteActions({ quoteId, status }: QuoteActionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState<{
        title: string;
        message: string;
    } | null>(null);
    const router = useRouter();

    const handleCancelClick = () => {
        setShowConfirmModal(true);
    };

    const handleCancelConfirm = async () => {
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
                setSuccessData({
                    title: "¡Cotización cancelada!",
                    message: "La cotización ha sido cancelada exitosamente."
                });
                setShowSuccessModal(true);
            } else {
                setSuccessData({
                    title: "Error al cancelar",
                    message: result.error || "Ocurrió un error inesperado. Por favor, intenta nuevamente."
                });
                setShowSuccessModal(true);
            }
        } catch (error) {
            console.error("Error al cancelar cotización:", error);
            setSuccessData({
                title: "Error de conexión",
                message: "Error al cancelar la cotización. Por favor, verifica tu conexión e intenta nuevamente."
            });
            setShowSuccessModal(true);
        } finally {
            setIsLoading(false);
        }
    };

    const canCancel = ['DRAFT', 'SUBMITTED'].includes(status) && status !== 'CANCELLED';

    if (!canCancel) return null;

    return (
        <>
            <button
                onClick={handleCancelClick}
                disabled={isLoading}
                className="text-red-600 hover:underline disabled:opacity-50"
            >
                {isLoading ? "Cancelando..." : "Cancelar"}
            </button>

            {/* Modal de confirmación */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleCancelConfirm}
                title="Cancelar cotización"
                message="¿Estás seguro de que quieres cancelar esta cotización? Esta acción no se puede deshacer."
                confirmText="Sí, cancelar"
                cancelText="No, mantener"
                variant="danger"
            />

            {/* Modal de resultado */}
            {successData && (
                <SuccessModal
                    isOpen={showSuccessModal}
                    onClose={() => {
                        setShowSuccessModal(false);
                        setSuccessData(null);
                        // Si fue exitosa la cancelación, recargar la página
                        if (successData.title.includes("cancelada")) {
                            router.refresh();
                        }
                    }}
                    title={successData.title}
                    message={successData.message}
                />
            )}
        </>
    );
}