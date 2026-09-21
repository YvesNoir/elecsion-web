import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import AccountSidebar from "@/components/AccountSidebar";
import FilesManager, { type StoredFileData } from "@/components/admin/FilesManager";
import PortalClientsUrlField from "@/components/admin/PortalClientsUrlField";
import { normalizePortalClientsUrl, PORTAL_CLIENTS_URL_KEY } from "@/lib/site-settings";

export default async function ArchivosPage() {
    const session = await getSession();

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/");
    }

    const files = await prisma.storedFile.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            originalName: true,
            url: true,
            contentType: true,
            sizeBytes: true,
            createdAt: true,
            uploadedBy: { select: { name: true, email: true } },
        },
    });

    const portalClientsSetting = await prisma.siteSetting.findUnique({
        where: { key: PORTAL_CLIENTS_URL_KEY },
        select: { value: true },
    });

    const serializedFiles: StoredFileData[] = files.map((file) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
    }));

    return (
        <>
            <div className="mb-4">
                <Link href="/" className="text-[#384A93] hover:underline text-sm">
                    ← Catálogo
                </Link>
                <span className="mx-2 text-[#646464]">Mi Cuenta</span>
                <span className="mx-2 text-[#646464]">&gt;</span>
                <span className="mx-2 text-[#646464]">Archivos</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <AccountSidebar />
                </div>

                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg border border-[#B5B5B5]/40 overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#B5B5B5]/40">
                            <h1 className="text-xl font-semibold text-[#1C1C1C]">Archivos</h1>
                            <p className="text-sm text-[#646464] mt-1">
                                Cargá documentos y compartí sus URLs desde un solo lugar.
                            </p>
                        </div>

                        <div className="space-y-6 p-6">
                            <PortalClientsUrlField initialUrl={normalizePortalClientsUrl(portalClientsSetting?.value) ?? ""} />
                            <FilesManager initialFiles={serializedFiles} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
