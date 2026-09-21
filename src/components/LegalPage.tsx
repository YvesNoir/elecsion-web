import type { ReactNode } from "react";

type LegalSection = {
    title: string;
    paragraphs?: ReactNode[];
    items?: ReactNode[];
};

type LegalPageProps = {
    title: string;
    intro: string;
    updatedAt: string;
    sections: LegalSection[];
};

export default function LegalPage({ title, intro, updatedAt, sections }: LegalPageProps) {
    return (
        <article className="mx-auto w-full max-w-4xl px-6 py-8 text-[#1C1C1C] md:py-12">
            <header className="mb-10 border-b border-[#E5E5E5] pb-8">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#384A93]">
                    Información legal
                </p>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[#646464]">{intro}</p>
                <p className="mt-5 text-sm text-[#777]">Última actualización: {updatedAt}</p>
            </header>

            <div className="space-y-8 text-[15px] leading-7 text-[#424242]">
                {sections.map((section) => (
                    <section key={section.title}>
                        <h2 className="mb-3 text-xl font-semibold text-[#1C1C1C]">{section.title}</h2>
                        {section.paragraphs?.map((paragraph, index) => (
                            <p key={index} className="mb-3 last:mb-0">{paragraph}</p>
                        ))}
                        {section.items && (
                            <ul className="mt-3 list-disc space-y-2 pl-5">
                                {section.items.map((item, index) => <li key={index}>{item}</li>)}
                            </ul>
                        )}
                    </section>
                ))}
            </div>
        </article>
    );
}
