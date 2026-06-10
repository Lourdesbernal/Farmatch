import { Link, useNavigate } from "react-router-dom";
import { FarmatchLogoHorizontal } from "../components/FarmatchLogo";

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            {/* Nav */}
            <nav className="flex items-center justify-between px-10 py-5 border-b border-slate-100">
                <FarmatchLogoHorizontal height={48} />
                <Link to="/login" className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 transition text-sm">
                    Iniciar sesión
                </Link>
            </nav>

            {/* Hero */}
            <main className="mx-auto max-w-6xl px-8 py-20 flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1">
                    <div className="mb-5 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600 border border-blue-100">
                        Plataforma de salud inteligente
                    </div>
                    <h1 className="text-5xl font-extrabold leading-tight text-slate-900 mb-6">
                        Encontrá tus medicamentos
                        <span className="text-blue-600"> en segundos.</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-lg leading-relaxed mb-8">
                        Encontrá dónde comprar tus medicamentos recetados, en tiempo real, cerca tuyo.
                    </p>

                    <div className="space-y-3 mb-10">
                        {[
                            "Encontrá farmacias cercanas con tu medicamento en stock",
                            "Recetas digitales y reservas en un clic",
                            "Asistente IA farmacológico disponible 24/7",
                        ].map((text) => (
                            <div key={text} className="flex items-center gap-3 text-slate-600 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                <span>{text}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => navigate("/login")}
                        className="rounded-2xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition shadow-sm shadow-blue-200"
                    >
                        Comenzar
                    </button>
                </div>

                {/* Mock dashboard */}
                <div className="flex-1 flex justify-center">
                    <div className="w-[320px] rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-200">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <div>
                                <p className="font-bold text-slate-800 text-sm">Bienvenida, Lucía</p>
                                <p className="text-xs text-slate-400">paciente</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">LF</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {[
                                { label: "Recetas activas", value: "3" },
                                { label: "Farmacias cercanas", value: "12" },
                                { label: "Reservas activas", value: "2" },
                                { label: "Medicamentos", value: "5" },
                            ].map(({ label, value }) => (
                                <div key={label} className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                                    <p className="text-2xl font-bold text-blue-600">{value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-xl bg-green-50 border border-green-100 p-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
                            <p className="text-xs text-green-700 font-medium">Tu pedido está listo para retirar</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Cómo funciona */}
            <section className="bg-slate-50 border-y border-slate-100 py-20 px-8">
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 mb-3">¿Cómo funciona?</h2>
                    <p className="text-slate-500">En tres pasos simples</p>
                </div>
                <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
                    {[
                        { paso: "1", titulo: "Buscás tu medicamento", desc: "Seleccionás tus recetas activas y FARMATCH encuentra las farmacias con stock disponible cerca tuyo." },
                        { paso: "2", titulo: "Elegís la farmacia", desc: "Ves el ranking de farmacias con disponibilidad, precio total y distancia. Elegís la mejor opción." },
                        { paso: "3", titulo: "Retirás tu pedido", desc: "La farmacia prepara tu pedido. Recibís una notificación cuando está listo para retirar." },
                    ].map(({ paso, titulo, desc }) => (
                        <div key={paso} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-left">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg mb-4">
                                {paso}
                            </div>
                            <h3 className="font-bold text-slate-800 mb-2">{titulo}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Para quién */}
            <section className="py-20 px-8">
                <div className="max-w-5xl mx-auto text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 mb-3">Una plataforma para todos</h2>
                    <p className="text-slate-500">Pacientes, médicos y farmacias conectados en un mismo sistema</p>
                </div>
                <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
                    {[
                        {
                            titulo: "Pacientes",
                            color: "border-blue-200 bg-blue-50",
                            badge: "bg-blue-600 text-white",
                            features: [
                                "Buscá farmacias con tu medicamento en stock",
                                "Reservá sin moverte de tu casa",
                                "Seguí el estado de tu pedido en tiempo real",
                                "Asistente IA para dudas sobre medicamentos",
                            ],
                        },
                        {
                            titulo: "Médicos",
                            color: "border-indigo-200 bg-indigo-50",
                            badge: "bg-indigo-600 text-white",
                            features: [
                                "Emitís recetas digitales en segundos",
                                "Ves qué medicamentos retiró cada paciente",
                                "Gestionás tus pacientes desde un panel",
                                "Asistente clínico con información farmacológica",
                            ],
                        },
                        {
                            titulo: "Farmacias",
                            color: "border-green-200 bg-green-50",
                            badge: "bg-green-600 text-white",
                            features: [
                                "Recibís pedidos digitales organizados",
                                "Gestionás tu stock en tiempo real",
                                "Estadísticas de ventas y demanda",
                                "Alertas de medicamentos más buscados",
                            ],
                        },
                    ].map(({ titulo, color, badge, features }) => (
                        <div key={titulo} className={`rounded-2xl p-6 border ${color}`}>
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold mb-4 ${badge}`}>
                                {titulo}
                            </span>
                            <ul className="space-y-2.5">
                                {features.map((f) => (
                                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-1.5" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA final */}
            <section className="bg-blue-600 py-16 px-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-3">¿Listo para empezar?</h2>
                <p className="text-blue-100 mb-8 text-lg">Unite a FARMATCH y simplificá el acceso a tus medicamentos</p>
                <button
                    onClick={() => navigate("/login")}
                    className="rounded-2xl bg-white text-blue-600 px-8 py-3.5 text-base font-bold hover:bg-blue-50 transition"
                >
                    Crear cuenta gratis
                </button>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-100 px-10 py-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <FarmatchLogoHorizontal height={48} />
                    <p className="text-sm text-slate-400">© 2026 FARMATCH · Plataforma de salud inteligente</p>
                    <div className="flex gap-6 text-sm text-slate-400">
                        <span>Argentina</span>
                        <span>Privacidad</span>
                        <span>Términos</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}