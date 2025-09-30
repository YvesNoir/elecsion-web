// src/app/login/page.tsx
"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
    const [email, setEmail] = useState("cliente@empresa.com");
    const [password, setPassword] = useState("123456");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const callbackUrl = useSearchParams().get("callbackUrl") ?? "/";

    useEffect(() => {
        // Ocultar completamente header, footer y el contenedor principal
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');
        const cartDrawer = document.querySelector('aside'); // CartDrawer
        
        if (header) header.style.display = 'none';
        if (footer) footer.style.display = 'none';
        if (cartDrawer) cartDrawer.style.display = 'none';
        
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        
        return () => {
            if (header) header.style.display = 'block';
            if (footer) footer.style.display = 'block';
            if (cartDrawer) cartDrawer.style.display = 'block';
            document.body.style.overflow = 'unset';
        };
    }, []);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        
        try {
            console.log("Intentando login con:", { email, passwordLength: password.length });
            
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl,
            });
            
            console.log("Respuesta de signIn:", res);
            
            if (res?.ok) {
                console.log("Login exitoso, redirigiendo a:", callbackUrl);
                window.location.href = callbackUrl; // Usar window.location en lugar de router.push
            } else {
                console.error("Error de login:", res?.error);
                alert(`Error de login: ${res?.error || "Credenciales incorrectas"}`);
            }
        } catch (error) {
            console.error("Error en signIn:", error);
            alert(`Error de conexión: ${error}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#384A93] via-[#4a5aa3] to-[#5c6cb3] flex items-center justify-center p-4 overflow-hidden"
             style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            {/* Fondo con patrón sutil */}
            <div className="absolute inset-0 opacity-10">
                <div className="h-full w-full" style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255,255,255)'%3e%3cpath d='m0 0l32 32M32 0L0 32'/%3e%3c/svg%3e")`,
                    backgroundSize: '64px 64px'
                }}></div>
            </div>
            
            <div className="relative w-full max-w-md z-10">
                {/* Card principal */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden relative">
                    {/* Header con logo */}
                    <div className="bg-gradient-to-r from-[#384A93] to-[#4a5aa3] px-8 py-8 text-center">
                        <div className="mb-4">
                            <Link href="/">
                                <img 
                                    src="/logo-elecsion.svg" 
                                    alt="Elecsion" 
                                    className="h-12 mx-auto filter brightness-0 invert"
                                />
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Bienvenido a la Plataforma de ELECSION
                        </h1>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            Accede a tu cuenta para gestionar pedidos, cotizaciones y consultar tu historial de compras
                        </p>
                    </div>

                    {/* Formulario */}
                    <div className="p-8">
                        <form onSubmit={onSubmit} className="space-y-6">
                            {/* Campo Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-[#1C1C1C] mb-2">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-[#B5B5B5]/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent transition-colors bg-[#F5F5F7] hover:bg-white"
                                        placeholder="tu@email.com"
                                        required
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-[#646464]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Campo Contraseña */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-[#1C1C1C] mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-[#B5B5B5]/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent transition-colors bg-[#F5F5F7] hover:bg-white pr-12"
                                        placeholder="123456"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5 text-[#646464]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.76 7.76m4.242 4.242L14.12 14.12m-4.242-4.242L12 12m-2.122-2.122l-4.118-4.118" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-[#646464]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-[#646464]">
                                    Contraseña por defecto: 123456
                                </p>
                            </div>

                            {/* Link ¿Olvidaste contraseña? */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        className="h-4 w-4 text-[#384A93] focus:ring-[#384A93] border-[#B5B5B5]/60 rounded"
                                    />
                                    <label htmlFor="remember" className="ml-2 block text-sm text-[#646464]">
                                        Recordarme
                                    </label>
                                </div>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-[#384A93] hover:text-[#2e3d7a] transition-colors"
                                >
                                    ¿Te olvidaste la contraseña?
                                </Link>
                            </div>

                            {/* Botón Ingresar */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#384A93] to-[#4a5aa3] text-white py-3 px-4 rounded-lg font-medium hover:from-[#2e3d7a] hover:to-[#3d4d93] focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Ingresando...
                                    </div>
                                ) : (
                                    "Ingresar"
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[#B5B5B5]/40"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-[#646464]">¿No tienes cuenta?</span>
                                </div>
                            </div>

                            {/* Botón Registrarse */}
                            <Link
                                href="/contacto"
                                className="w-full border-2 border-[#384A93] text-[#384A93] py-3 px-4 rounded-lg font-medium hover:bg-[#384A93] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:ring-offset-2 transition-all duration-200 text-center block"
                            >
                                Solicitar Acceso
                            </Link>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-white/80 text-sm">
                        © 2024 Elecsion - Distribuidora de productos eléctricos y ferretería
                    </p>
                    <div className="flex justify-center gap-4 mt-4">
                        <Link href="/contacto" className="text-white/60 hover:text-white text-sm transition-colors">
                            Contacto
                        </Link>
                        <Link href="/catalogo" className="text-white/60 hover:text-white text-sm transition-colors">
                            Catálogo
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}