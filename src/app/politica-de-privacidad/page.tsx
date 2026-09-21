import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
    title: "Política de privacidad | Elecsion",
    description: "Política de privacidad y tratamiento de datos personales de Elecsion.",
};

const sections = [
    {
        title: "1. Responsable y alcance",
        paragraphs: [
            "Esta política explica cómo Elecsion trata los datos personales que recibe a través del sitio, el catálogo, el portal de clientes, los formularios de contacto y las solicitudes de cotización o pedido.",
            "El responsable puede ser contactado en Av. Mitre 3514, Buenos Aires, Argentina, o por correo electrónico a info@elecsion.com.",
        ],
    },
    {
        title: "2. Datos que podemos recopilar",
        paragraphs: ["Según el uso que hagas del sitio, podemos recibir:"],
        items: [
            "Datos de identificación y contacto, como nombre, correo electrónico, teléfono, empresa y domicilio comercial.",
            "Datos de acceso al portal de clientes y preferencias asociadas a la cuenta.",
            "Información sobre cotizaciones, pedidos, productos consultados y comunicaciones con Elecsion.",
            "Datos técnicos básicos, como dirección IP, navegador, dispositivo, páginas visitadas y eventos de uso del sitio.",
        ],
    },
    {
        title: "3. Para qué utilizamos los datos",
        paragraphs: ["Utilizamos la información para:"],
        items: [
            "Crear y administrar cuentas de clientes.",
            "Responder consultas, preparar cotizaciones y gestionar solicitudes de pedidos.",
            "Verificar identidad, prevenir usos indebidos y proteger la seguridad de la plataforma.",
            "Mejorar el catálogo, la navegación y la calidad de nuestros servicios.",
            "Enviar comunicaciones relacionadas con una consulta, cuenta, cotización o pedido, y cumplir obligaciones legales cuando corresponda.",
        ],
    },
    {
        title: "4. Compartir información",
        paragraphs: [
            "No vendemos datos personales. Podemos compartir la información necesaria con proveedores que colaboran en el alojamiento, operación, seguridad, correo electrónico, base de datos o medición del sitio, únicamente para prestar esos servicios y bajo obligaciones de confidencialidad.",
            "También podremos comunicar información cuando sea necesario para cumplir una obligación legal, responder a una autoridad competente, prevenir fraude o proteger los derechos y la seguridad de Elecsion y de otras personas.",
        ],
    },
    {
        title: "5. Cookies y tecnologías similares",
        paragraphs: [
            "El sitio puede utilizar cookies, almacenamiento local y herramientas de medición para mantener sesiones, recordar preferencias, operar el carrito y entender cómo se utiliza la plataforma. También puede utilizar Google Analytics u otros servicios equivalentes para obtener métricas generales de navegación.",
            "Podés configurar tu navegador para limitar o eliminar cookies. Algunas funciones, como el acceso al portal o el carrito, pueden dejar de funcionar correctamente si se deshabilita el almacenamiento necesario.",
        ],
    },
    {
        title: "6. Conservación y seguridad",
        paragraphs: [
            "Conservamos los datos durante el tiempo necesario para cumplir las finalidades informadas, mantener la relación comercial, resolver reclamos y cumplir obligaciones legales. Luego podremos eliminarlos, anonimizarlos o conservarlos cuando exista una razón legítima para hacerlo.",
            "Aplicamos medidas técnicas y organizativas razonables para proteger la información contra acceso, pérdida, alteración o uso no autorizado. Ningún sistema conectado a internet puede garantizar seguridad absoluta.",
        ],
    },
    {
        title: "7. Derechos de las personas titulares",
        paragraphs: [
            "Podés solicitar información sobre los datos que tenemos, pedir su actualización o rectificación y, cuando corresponda, solicitar su eliminación o confidencialidad. Para ejercer estos derechos, escribinos a info@elecsion.com indicando tu nombre, el dato de contacto utilizado y el pedido concreto.",
            "Podemos solicitar información adicional para verificar la identidad de quien realiza la solicitud y responderemos conforme a los plazos y requisitos de la normativa aplicable.",
        ],
    },
    {
        title: "8. Cambios y contacto",
        paragraphs: [
            "Podemos actualizar esta política para reflejar cambios en nuestros servicios, procesos o en la normativa aplicable. La versión vigente estará siempre publicada en esta página.",
            "Si tenés preguntas sobre privacidad o querés realizar una solicitud relacionada con tus datos personales, podés contactarnos en info@elecsion.com.",
        ],
    },
];

export default function PrivacidadPage() {
    return (
        <LegalPage
            title="Política de privacidad"
            intro="En Elecsion cuidamos la información que nos compartís al utilizar nuestro catálogo, portal de clientes y canales de atención."
            updatedAt="21 de septiembre de 2026"
            sections={sections}
        />
    );
}
