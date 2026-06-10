import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { FarmatchLogoHorizontal } from "../components/FarmatchLogo";

type Modo = "login" | "registro-paciente" | "registro-medico" | "registro-farmacia";

const Input = ({
    type = "text", placeholder, value, onChange, autoFocus = false
}: {
    type?: string; placeholder: string; value: string;
    onChange: (v: string) => void; autoFocus?: boolean;
}) => (
    <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
    />
);

const PasswordInput = ({
    placeholder, value, onChange
}: {
    placeholder: string; value: string; onChange: (v: string) => void;
}) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? "text" : "password"}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    );
};

export default function Login() {
    const navigate = useNavigate();
    const [modo, setModo] = useState<Modo>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [matricula, setMatricula] = useState("");
    const [codigoFarmacia, setCodigoFarmacia] = useState("");
    // Paciente
    const [pacienteNombre, setPacienteNombre] = useState("");
    const [pacienteApellido, setPacienteApellido] = useState("");
    const [pacienteDni, setPacienteDni] = useState("");
    const [pacienteObraSocial, setPacienteObraSocial] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function iniciarSesion() {
        setError("");
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) { setError("Email o contraseña incorrectos."); return; }
        const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", data.user.id).single();
        if (perfil?.rol === "paciente") navigate("/paciente");
        else if (perfil?.rol === "medico") navigate("/medico");
        else if (perfil?.rol === "farmacia") navigate("/farmacia");
    }

    async function registrarPaciente() {
        setError("");
        if (!pacienteNombre.trim() || !pacienteApellido.trim() || !pacienteDni.trim()) {
            setError("Nombre, apellido y DNI son obligatorios."); return;
        }
        if (password !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }
        setLoading(true);

        // Verificar que el DNI no exista ya
        const { data: pacienteExistente } = await supabase.from("pacientes").select("id_paciente").eq("dni", pacienteDni.trim()).single();
        if (pacienteExistente) { setError("Ya existe un paciente con ese DNI."); setLoading(false); return; }

        // Crear cuenta auth
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) { setError(authError.message); setLoading(false); return; }

        // Crear registro en pacientes
        const { data: nuevoPaciente, error: errPaciente } = await supabase.from("pacientes").insert({
            nombre: pacienteNombre.trim(),
            apellido: pacienteApellido.trim(),
            dni: pacienteDni.trim(),
            email: email.trim(),
            obra_social: pacienteObraSocial.trim() || null,
            id_medico_cargo: null,
        }).select().single();

        if (errPaciente || !nuevoPaciente) { setError("Error al crear el perfil. Intentá de nuevo."); setLoading(false); return; }

        // Crear perfil
        await supabase.from("perfiles").insert({
            id: data.user!.id,
            nombre: `${pacienteNombre.trim()} ${pacienteApellido.trim()}`,
            rol: "paciente",
            ficha_id: nuevoPaciente.id_paciente,
        });

        setLoading(false);
        setSuccess("Cuenta creada. Ya podés iniciar sesión.");
        setTimeout(() => { resetForm(); setModo("login"); setSuccess(""); }, 2000);
    }

    async function registrarMedico() {
        setError("");
        if (password !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }
        setLoading(true);
        const { data: medico } = await supabase.from("medicos").select("*").eq("matricula", matricula).single();
        if (!medico) { setError("Matrícula no encontrada. Contactá a FARMATCH."); setLoading(false); return; }
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) { setError(authError.message); setLoading(false); return; }
        await supabase.from("perfiles").insert({ id: data.user!.id, nombre: medico.nombre + " " + medico.apellido, rol: "medico", ficha_id: medico.id_medico });
        setLoading(false);
        setSuccess("Cuenta creada. Ya podés iniciar sesión.");
        setTimeout(() => { resetForm(); setModo("login"); setSuccess(""); }, 2000);
    }

    async function registrarFarmacia() {
        setError("");
        if (password !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }
        setLoading(true);
        const { data: farmacia } = await supabase.from("farmacias").select("*").eq("codigo_farmacia", codigoFarmacia).single();
        if (!farmacia) { setError("Código no encontrado. Contactá a FARMATCH."); setLoading(false); return; }
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) { setError(authError.message); setLoading(false); return; }
        await supabase.from("perfiles").insert({ id: data.user!.id, nombre: farmacia.nombre, rol: "farmacia", ficha_id: farmacia.id_farmacia });
        setLoading(false);
        setSuccess("Cuenta creada. Ya podés iniciar sesión.");
        setTimeout(() => { resetForm(); setModo("login"); setSuccess(""); }, 2000);
    }

    function resetForm() {
        setEmail(""); setPassword(""); setConfirmPassword("");
        setMatricula(""); setCodigoFarmacia("");
        setPacienteNombre(""); setPacienteApellido(""); setPacienteDni(""); setPacienteObraSocial("");
        setError(""); setSuccess("");
    }

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && modo === "login") iniciarSesion();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4" onKeyDown={handleKey}>
            <div className="w-full max-w-md">
                <div className="rounded-3xl bg-white p-10 shadow-lg shadow-slate-200 border border-slate-100">
                    <div className="mb-8 flex justify-center">
                        <FarmatchLogoHorizontal height={48} />
                    </div>

                    {/* LOGIN */}
                    {modo === "login" && (
                        <>
                            <h1 className="mb-1 text-2xl font-bold text-slate-900">Iniciar sesión</h1>
                            <p className="mb-7 text-sm text-slate-400">Accedé a tu cuenta FARMATCH</p>
                            <div className="space-y-3">
                                <Input placeholder="Email" type="email" value={email} onChange={setEmail} autoFocus />
                                <PasswordInput placeholder="Contraseña" value={password} onChange={setPassword} />
                            </div>
                            {error && <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}
                            <button onClick={iniciarSesion} disabled={loading} className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
                                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Entrando...</span> : "Entrar"}
                            </button>

                            <div className="mt-7 pt-6 border-t border-slate-100">
                                <p className="mb-4 text-center text-xs text-slate-400 font-medium uppercase tracking-wide">¿No tenés cuenta?</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={() => { resetForm(); setModo("registro-paciente"); }} className="rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition">
                                        Soy paciente
                                    </button>
                                    <button onClick={() => { resetForm(); setModo("registro-medico"); }} className="rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition">
                                        Soy médico
                                    </button>
                                    <button onClick={() => { resetForm(); setModo("registro-farmacia"); }} className="rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition">
                                        Soy farmacia
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* REGISTRO PACIENTE */}
                    {modo === "registro-paciente" && (
                        <>
                            <button onClick={() => { resetForm(); setModo("login"); }} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-6 transition">
                                <ArrowLeft size={14} /> Volver
                            </button>
                            <h1 className="mb-1 text-2xl font-bold text-slate-900">Crear cuenta</h1>
                            <p className="mb-7 text-sm text-slate-400">Registrate como paciente en FARMATCH</p>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <Input placeholder="Nombre" value={pacienteNombre} onChange={setPacienteNombre} autoFocus />
                                    <Input placeholder="Apellido" value={pacienteApellido} onChange={setPacienteApellido} />
                                </div>
                                <Input placeholder="DNI (sin puntos)" value={pacienteDni} onChange={(v) => setPacienteDni(v.replace(/\D/g, ""))} />
                                <Input placeholder="Obra social (opcional)" value={pacienteObraSocial} onChange={setPacienteObraSocial} />
                                <Input placeholder="Email" type="email" value={email} onChange={setEmail} />
                                <PasswordInput placeholder="Contraseña" value={password} onChange={setPassword} />
                                <PasswordInput placeholder="Confirmar contraseña" value={confirmPassword} onChange={setConfirmPassword} />
                            </div>
                            {error && <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}
                            {success && <div className="mt-3 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-600">{success}</div>}
                            <button onClick={registrarPaciente} disabled={loading} className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
                                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creando cuenta...</span> : "Crear cuenta"}
                            </button>
                        </>
                    )}

                    {/* REGISTRO MÉDICO */}
                    {modo === "registro-medico" && (
                        <>
                            <button onClick={() => { resetForm(); setModo("login"); }} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-6 transition">
                                <ArrowLeft size={14} /> Volver
                            </button>
                            <h1 className="mb-1 text-2xl font-bold text-slate-900">Registro médico</h1>
                            <p className="mb-7 text-sm text-slate-400">Verificamos tu matrícula antes de crear la cuenta</p>
                            <div className="space-y-3">
                                <Input placeholder="Matrícula (ej: MAT-1)" value={matricula} onChange={setMatricula} autoFocus />
                                <Input placeholder="Email" type="email" value={email} onChange={setEmail} />
                                <PasswordInput placeholder="Contraseña" value={password} onChange={setPassword} />
                                <PasswordInput placeholder="Confirmar contraseña" value={confirmPassword} onChange={setConfirmPassword} />
                            </div>
                            {error && <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}
                            {success && <div className="mt-3 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-600">{success}</div>}
                            <button onClick={registrarMedico} disabled={loading} className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
                                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verificando...</span> : "Crear cuenta"}
                            </button>
                        </>
                    )}

                    {/* REGISTRO FARMACIA */}
                    {modo === "registro-farmacia" && (
                        <>
                            <button onClick={() => { resetForm(); setModo("login"); }} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-6 transition">
                                <ArrowLeft size={14} /> Volver
                            </button>
                            <h1 className="mb-1 text-2xl font-bold text-slate-900">Registro farmacia</h1>
                            <p className="mb-7 text-sm text-slate-400">Verificamos tu código antes de crear la cuenta</p>
                            <div className="space-y-3">
                                <Input placeholder="Código de farmacia (ej: FARM-34)" value={codigoFarmacia} onChange={setCodigoFarmacia} autoFocus />
                                <Input placeholder="Email" type="email" value={email} onChange={setEmail} />
                                <PasswordInput placeholder="Contraseña" value={password} onChange={setPassword} />
                                <PasswordInput placeholder="Confirmar contraseña" value={confirmPassword} onChange={setConfirmPassword} />
                            </div>
                            {error && <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}
                            {success && <div className="mt-3 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-600">{success}</div>}
                            <button onClick={registrarFarmacia} disabled={loading} className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
                                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verificando...</span> : "Crear cuenta"}
                            </button>
                        </>
                    )}
                </div>
                <p className="mt-6 text-center text-xs text-slate-400">© 2026 FARMATCH · Tu farmacia, en el mapa.</p>
            </div>
        </div>
    );
}