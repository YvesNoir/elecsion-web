"use client";

import React from "react";

type Client = {
    id: string;
    name: string | null;
    email: string;
    company: string | null;
};

type ClientSelectorProps = {
    clients: Client[];
    selectedClientId: string;
    onClientChange: (clientId: string) => void;
    userRole: string;
};

export default function ClientSelector({
    clients,
    selectedClientId,
    onClientChange,
    userRole
}: ClientSelectorProps) {
    const isClientUser = userRole === "CLIENT";
    const selectedClient = clients.find(client => client.id === selectedClientId);

    if (isClientUser && clients.length > 0) {
        // Para usuarios CLIENT, mostrar solo su información sin dropdown
        const client = clients[0];
        return (
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-4">
                <h3 className="text-lg font-medium text-[#1C1C1C] mb-3">Cliente</h3>
                <div className="bg-[#F5F5F7] rounded-md p-3">
                    <div className="text-sm font-medium text-[#1C1C1C]">
                        {client.company || client.name || "Sin nombre"}
                    </div>
                    {client.company && client.name && (
                        <div className="text-sm text-[#646464] mt-1">
                            {client.name}
                        </div>
                    )}
                    <div className="text-sm text-[#646464] mt-1">
                        {client.email}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-[#E5E5E5] p-4">
            <h3 className="text-lg font-medium text-[#1C1C1C] mb-3">Cliente</h3>

            {clients.length === 0 ? (
                <div className="text-sm text-[#646464]">
                    No hay clientes disponibles
                </div>
            ) : (
                <div className="space-y-3">
                    <select
                        value={selectedClientId}
                        onChange={(e) => onClientChange(e.target.value)}
                        className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent text-sm"
                    >
                        <option value="">Seleccionar cliente...</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.company || client.name || "Sin nombre"} - {client.email}
                            </option>
                        ))}
                    </select>

                    {selectedClient && (
                        <div className="bg-[#F5F5F7] rounded-md p-3">
                            <div className="text-sm font-medium text-[#1C1C1C]">
                                {selectedClient.company || selectedClient.name || "Sin nombre"}
                            </div>
                            {selectedClient.company && selectedClient.name && (
                                <div className="text-sm text-[#646464] mt-1">
                                    Contacto: {selectedClient.name}
                                </div>
                            )}
                            <div className="text-sm text-[#646464] mt-1">
                                Email: {selectedClient.email}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!selectedClientId && clients.length > 0 && (
                <div className="mt-2 text-xs text-[#646464]">
                    Selecciona un cliente para comenzar a agregar productos
                </div>
            )}
        </div>
    );
}