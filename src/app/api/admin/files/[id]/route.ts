import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { deleteObject } from "@/lib/aws-s3";

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await getSession();
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const file = await prisma.storedFile.findUnique({ where: { id } });
    if (!file) {
        return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    try {
        await deleteObject(file.key);
        await prisma.storedFile.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error eliminando archivo administrativo:", error);
        return NextResponse.json({ error: "No se pudo eliminar el archivo" }, { status: 500 });
    }
}
