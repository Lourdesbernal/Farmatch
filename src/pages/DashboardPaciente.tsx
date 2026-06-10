import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import { FarmatchLogoHorizontal } from "../components/FarmatchLogo";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import ChatIA from "../components/ChatIA";
import { Search, FileText, PackageCheck, LogOut } from "lucide-react";


delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DashboardPaciente() {
    const navigate = useNavigate();
    const [farmacias, setFarmacias] = useState<any[]>([]);
    const [farmaciasCercanas, setFarmaciasCercanas] = useState<any[]>([]);
    const [recetas, setRecetas] = useState<any[]>([]);
    const [nombre, setNombre] = useState("");
    const [medicamentosPendientes, setMedicamentosPendientes] = useState(0);
    const [reservasActivas, setReservasActivas] = useState(0);
    const [reservaListaParaRetirar, setReservaListaParaRetirar] = useState<any | null>(null);
    const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
    const [ubicacionError, setUbicacionError] = useState(false);

    async function cerrarSesion() {
        await supabase.auth.signOut();
        navigate("/");
    }

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => setUbicacionError(true)
        );
    }, []);

    useEffect(() => {
        if (!ubicacion || farmacias.length === 0) return;
        const cercanas = farmacias
            .map((f) => ({ ...f, distancia: calcularDistanciaKm(ubicacion.lat, ubicacion.lng, f.latitud, f.longitud) }))
            .filter((f) => f.distancia <= 5)
            .sort((a, b) => a.distancia - b.distancia);
        setFarmaciasCercanas(cercanas);
    }, [ubicacion, farmacias]);

    useEffect(() => {
        async function cargarDatos() {
            const { data: farmaciasData } = await supabase.from("farmacias").select("*");
            if (farmaciasData) setFarmacias(farmaciasData);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
            if (perfil) setNombre(perfil.nombre);

            const { data: paciente } = await supabase.from("pacientes").select("*").eq("email", user.email).single();
            if (!paciente) return;

            const { data: recetasData } = await supabase.from("recetas").select("*")
                .eq("id_paciente", paciente.id_paciente).eq("estado", "activa");
            if (recetasData) {
                setRecetas(recetasData);
                const idsRecetas = recetasData.map((r) => r.id_receta);
                const { data: itemsPaciente } = await supabase.from("receta_items").select("*")
                    .in("id_receta", idsRecetas).eq("entregado", false);
                setMedicamentosPendientes(itemsPaciente?.length || 0);
            }

            // Reservas activas (pendiente + preparando + lista)
            const { data: reservasData } = await supabase.from("reservas").select("*")
                .eq("id_paciente", paciente.id_paciente)
                .in("estado", ["pendiente", "preparando", "lista"]);
            if (reservasData) {
                setReservasActivas(reservasData.length);
                const lista = reservasData.find((r) => r.estado === "lista");
                if (lista) {
                    const { data: farmacia } = await supabase.from("farmacias").select("nombre, direccion")
                        .eq("id_farmacia", lista.id_farmacia).single();
                    setReservaListaParaRetirar(farmacia);
                }
            }
        }
        cargarDatos();
    }, []);

    const mapCenter = ubicacion ?? { lat: -34.6037, lng: -58.3816 };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header cohesivo con farmacia */}
            <header className="bg-white border-b-2 border-blue-600 shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-3">
                    <FarmatchLogoHorizontal height={48} />
                    <div className="text-right">
                        <p className="font-semibold text-slate-800">{nombre}</p>
                        <p className="text-sm text-slate-400">paciente</p>
                        <button onClick={cerrarSesion} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50">
                            <LogOut size={15} />
                            <span>Salir</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl p-8">
                <h2 className="mb-2 text-3xl font-bold text-slate-800">
                    Bienvenida, {nombre.split(" ")[0]}
                </h2>
                <p className="mb-8 text-slate-400">¿Qué necesitás hoy?</p>

                {/* Alerta lista para retirar */}
                {reservaListaParaRetirar && (
                    <div className="mb-6 rounded-2xl border-l-4 border-green-500 bg-green-50 p-4 flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-green-700">Tu pedido está listo para retirar</p>
                            <p className="text-sm text-green-600">{reservaListaParaRetirar.nombre} · {reservaListaParaRetirar.direccion}</p>
                        </div>
                        <button onClick={() => navigate("/mis-reservas")} className="rounded-xl bg-green-600 px-4 py-2 text-sm text-white font-medium hover:bg-green-700 transition">
                            Ver reservas
                        </button>
                    </div>
                )}

                {/* Estadísticas */}
                <div className="mb-8 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                        <p className="text-sm text-slate-500">Recetas activas</p>
                        <p className="mt-2 text-4xl font-bold text-blue-600">{recetas.length}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                        <p className="text-sm text-slate-500">Medicamentos pendientes</p>
                        <p className="mt-2 text-4xl font-bold text-blue-600">{medicamentosPendientes}</p>
                        <p className="text-xs text-slate-400 mt-1">sin entregar</p>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                        <p className="text-sm text-slate-500">Reservas activas</p>
                        <p className="mt-2 text-4xl font-bold text-blue-600">{reservasActivas}</p>
                        <p className="text-xs text-slate-400 mt-1">en proceso</p>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                        <p className="text-sm text-slate-500">Farmacias cercanas</p>
                        <p className="mt-2 text-4xl font-bold text-blue-600">
                            {ubicacion ? farmaciasCercanas.length : "—"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {ubicacionError ? "sin ubicación" : ubicacion ? "en radio de 5 km" : "obteniendo..."}
                        </p>
                    </div>
                </div>

                {/* Acciones rápidas */}
                <h2 className="mb-4 text-lg font-bold text-slate-800">Acciones rápidas</h2>
                <div className="mb-10 grid gap-4 md:grid-cols-3">
                    <button onClick={() => navigate("/buscar-medicamentos")} className="rounded-2xl bg-white p-6 text-left border border-slate-100 shadow-sm hover:shadow-md transition">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                            <Search size={20} className="text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800">Buscar medicamento</h3>
                        <p className="mt-1 text-sm text-slate-400">Encontrá disponibilidad en farmacias cercanas.</p>
                    </button>
                    <button onClick={() => navigate("/mis-recetas")} className="rounded-2xl bg-white p-6 text-left border border-slate-100 shadow-sm hover:shadow-md transition">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                            <FileText size={20} className="text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800">Mis recetas</h3>
                        <p className="mt-1 text-sm text-slate-400">Consultá todas tus recetas digitales.</p>
                    </button>
                    <button onClick={() => navigate("/mis-reservas")} className="rounded-2xl bg-white p-6 text-left border border-slate-100 shadow-sm hover:shadow-md transition">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                            <PackageCheck size={20} className="text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800">Mis reservas</h3>
                        <p className="mt-1 text-sm text-slate-400">Seguí el estado de tus pedidos.</p>
                        {reservasActivas > 0 && (
                            <span className="mt-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                {reservasActivas} activa{reservasActivas > 1 ? "s" : ""}
                            </span>
                        )}
                    </button>
                </div>

                {/* Mapa */}
                <h2 className="mb-4 text-lg font-bold text-slate-800">Farmacias cercanas</h2>
                {ubicacionError && <p className="mb-4 text-sm text-slate-400">No se pudo obtener tu ubicación. Mostrando todas las farmacias.</p>}

                <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm" style={{ height: "400px" }}>
                    {!ubicacion && !ubicacionError ? (
                        <div className="flex h-full items-center justify-center bg-slate-50">
                            <p className="text-slate-400">Obteniendo tu ubicación...</p>
                        </div>
                    ) : (
                        <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
                            <TileLayer
                                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            />
                            {ubicacion && (
                                <Circle center={[ubicacion.lat, ubicacion.lng]} radius={5000}
                                    pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.08 }} />
                            )}
                            {ubicacion && (
                                <Marker position={[ubicacion.lat, ubicacion.lng]}>
                                    <Popup>Tu ubicación</Popup>
                                </Marker>
                            )}
                            {farmacias.map((f) => (
                                <Marker key={f.id_farmacia} position={[f.latitud, f.longitud]}>
                                    <Popup>
                                        <strong>{f.nombre}</strong><br />{f.direccion}
                                        {ubicacion && <><br /><span>{calcularDistanciaKm(ubicacion.lat, ubicacion.lng, f.latitud, f.longitud).toFixed(1)} km</span></>}
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    )}
                </div>

                {/* Lista farmacias cercanas */}
                {ubicacion && farmaciasCercanas.length > 0 && (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {farmaciasCercanas.map((f) => (
                            <div key={f.id_farmacia} className="flex items-center justify-between rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
                                <div>
                                    <p className="font-semibold text-slate-800">{f.nombre}</p>
                                    <p className="text-sm text-slate-400">{f.direccion}</p>
                                </div>
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                                    {f.distancia.toFixed(1)} km
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <ChatIA rol="paciente" />
        </div>
    );
}