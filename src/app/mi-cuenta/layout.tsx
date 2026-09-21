import type { ReactNode } from "react";

export default function AccountLayout({ children }: { children: ReactNode }) {
    return <div className="pt-5 md:pt-6">{children}</div>;
}
