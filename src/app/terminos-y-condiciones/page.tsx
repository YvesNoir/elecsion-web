import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
    title: "Términos y condiciones | Elecsion",
    description: "Términos y condiciones de uso de los servicios de Elecsion.",
};

const sections = [
    {
        title: "1. Identificación y aceptación",
        paragraphs: [
            "Estos términos regulan el acceso y uso del sitio web, catálogo y portal de clientes de Elecsion, con domicilio informado en Av. Mitre 3514, Buenos Aires, Argentina.",
            "Al navegar por el sitio, crear una cuenta o enviar una solicitud de cotización o pedido, la persona usuaria declara que leyó y acepta estos términos. Si no está de acuerdo, debe abstenerse de utilizar los servicios.",
        ],
    },
    {
        title: "2. Servicios de Elecsion",
        paragraphs: [
            "Elecsion ofrece una plataforma digital para consultar productos eléctricos y de ferretería, revisar información de marcas y productos, solicitar cotizaciones, armar pedidos y comunicarse con el equipo comercial.",
            "El sitio funciona como canal de consulta y gestión comercial. La disponibilidad de cada producto, su precio final, stock, condiciones de venta, facturación y entrega pueden requerir una confirmación posterior por parte de Elecsion.",
        ],
    },
    {
        title: "3. Información de productos y precios",
        paragraphs: [
            "Procuramos mantener la información del catálogo actualizada. Sin embargo, pueden existir diferencias, errores de carga o demoras de actualización en descripciones, imágenes, precios, moneda, stock o características técnicas.",
            "Una solicitud enviada desde el sitio no implica aceptación automática ni reserva de stock. Las condiciones aplicables serán confirmadas por Elecsion antes de concretar la operación.",
        ],
    },
    {
        title: "4. Cuenta y acceso al portal de clientes",
        paragraphs: [
            "Para acceder a determinadas funciones puede ser necesario registrarse o contar con credenciales asignadas. La persona usuaria debe proporcionar información verdadera, mantenerla actualizada y proteger la confidencialidad de su contraseña.",
            "La persona usuaria debe informar a Elecsion si detecta un acceso no autorizado o cualquier uso indebido de su cuenta. Elecsion podrá limitar o suspender el acceso cuando sea necesario para proteger la plataforma, las cuentas o la seguridad del servicio.",
        ],
    },
    {
        title: "5. Cotizaciones y pedidos",
        paragraphs: [
            "Las cotizaciones y pedidos enviados a través del sitio son solicitudes comerciales sujetas a revisión. La confirmación de una operación podrá depender de la verificación de identidad, disponibilidad, precio, condiciones comerciales y datos de contacto.",
            "Cuando corresponda, Elecsion comunicará por los canales disponibles la modalidad de pago, facturación, retiro o entrega. Estas condiciones no se consideran confirmadas hasta que Elecsion las informe expresamente.",
        ],
    },
    {
        title: "6. Uso permitido",
        paragraphs: ["La plataforma debe utilizarse de forma lícita y de buena fe. Está prohibido:"],
        items: [
            "Utilizar el sitio para fines fraudulentos, ilegales o que perjudiquen a otras personas.",
            "Intentar acceder sin autorización a cuentas, sistemas, bases de datos o áreas restringidas.",
            "Introducir código malicioso, automatizaciones abusivas o cualquier elemento que afecte el funcionamiento del sitio.",
            "Usar la información del catálogo para copiar, publicar o explotar comercialmente contenidos sin autorización.",
        ],
    },
    {
        title: "7. Propiedad intelectual",
        paragraphs: [
            "Los textos, marcas, logotipos, imágenes, diseños y demás contenidos del sitio pertenecen a Elecsion o se utilizan con autorización de sus titulares. No se permite su reproducción o utilización fuera del uso personal y comercial legítimo de la plataforma sin autorización previa.",
        ],
    },
    {
        title: "8. Modificaciones y normativa aplicable",
        paragraphs: [
            "Elecsion podrá actualizar estos términos cuando cambien los servicios, procesos o requisitos legales. La versión vigente será la publicada en esta página.",
            "Nada de lo establecido en estos términos limita los derechos irrenunciables que correspondan a las personas consumidoras conforme a la normativa aplicable. Para consultas o reclamos, podés escribir a info@elecsion.com.",
        ],
    },
];

export default function TerminosPage() {
    return (
        <LegalPage
            title="Términos y condiciones"
            intro="Estas condiciones explican las reglas básicas para utilizar el catálogo, el portal de clientes y los canales comerciales de Elecsion."
            updatedAt="21 de septiembre de 2026"
            sections={sections}
        />
    );
}
