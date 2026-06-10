import { useState, useRef, useEffect } from "react";
import { X, Send, User, Loader } from "lucide-react";
import { FarmyIcon } from "./FarmyIcon";

type Rol = "paciente" | "medico" | "farmacia";
interface Mensaje { rol: "user" | "assistant"; contenido: string; }
interface Props { rol: Rol; contexto?: string; }

const systemPrompt = (rol: Rol, contexto?: string): string => {
    const advertencia = `Respondé siempre en español. Sé muy conciso y directo, máximo 2-3 oraciones por respuesta. Al final de cada respuesta agregá una línea corta recordando consultar con un profesional.`;
    const base: Record<Rol, string> = {
        paciente: `Sos un asistente farmacológico de FARMATCH que ayuda a pacientes. Podés explicar para qué sirven los medicamentos, cómo tomarlos, efectos secundarios comunes, qué alimentos o actividades evitar, y responder dudas generales sobre salud y medicación. No diagnosticás enfermedades ni modificás indicaciones médicas.${contexto ? `\nContexto del paciente: ${contexto}` : ""}\n${advertencia}`,
        medico: `Sos un asistente clínico de FARMATCH que ayuda a médicos. Podés responder sobre interacciones medicamentosas, dosis habituales, mecanismos de acción, contraindicaciones, equivalentes genéricos y comerciales, y guías clínicas. Usá lenguaje técnico apropiado para un profesional médico.${contexto ? `\nContexto: ${contexto}` : ""}\n${advertencia}`,
        farmacia: `Sos un asistente de FARMATCH que ayuda al personal de farmacias. Podés responder sobre equivalentes genéricos y comerciales, conservación de medicamentos, presentaciones disponibles, cadena de frío, y dudas operativas sobre dispensación.${contexto ? `\nContexto: ${contexto}` : ""}\n${advertencia}`,
    };
    return base[rol];
};

const mensajeInicial: Record<Rol, string> = {
    paciente: "Hola! Soy tu asistente de salud de FARMATCH. Podés preguntarme para qué sirve un medicamento, cómo tomarlo, efectos secundarios o qué evitar mientras lo tomás. ¿En qué te puedo ayudar?",
    medico: "Hola! Soy tu asistente clínico de FARMATCH. Podés consultarme sobre interacciones medicamentosas, dosis, contraindicaciones, equivalentes genéricos o guías clínicas. ¿En qué te puedo ayudar?",
    farmacia: "Hola! Soy tu asistente farmacéutico de FARMATCH. Podés preguntarme sobre equivalentes genéricos y comerciales, conservación de medicamentos, presentaciones disponibles o dudas sobre dispensación. ¿En qué te puedo ayudar?",
};

const placeholder: Record<Rol, string> = {
    paciente: "¿Para qué sirve este medicamento?",
    medico: "¿Hay interacción entre ibuprofeno y aspirina?",
    farmacia: "¿Cuál es el genérico de Atorvastatina?",
};

const titulo: Record<Rol, string> = {
    paciente: "Asistente de salud",
    medico: "Asistente clínico",
    farmacia: "Asistente farmacéutico",
};

const COHERE_API_KEY = import.meta.env.VITE_COHERE_KEY;

export default function ChatIA({ rol, contexto }: Props) {
    const [abierto, setAbierto] = useState(false);
    const [mensajes, setMensajes] = useState<Mensaje[]>([{ rol: "assistant", contenido: mensajeInicial[rol] }]);
    const [input, setInput] = useState("");
    const [cargando, setCargando] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Detectar modo oscuro del DOM


    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes, cargando]);
    useEffect(() => { if (abierto) setTimeout(() => inputRef.current?.focus(), 100); }, [abierto]);

    const enviar = async () => {
        const texto = input.trim();
        if (!texto || cargando) return;
        const nuevosMensajes: Mensaje[] = [...mensajes, { rol: "user", contenido: texto }];
        setMensajes(nuevosMensajes);
        setInput("");
        setCargando(true);
        try {
            const response = await fetch("https://api.cohere.com/v2/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${COHERE_API_KEY}` },
                body: JSON.stringify({
                    model: "command-r-plus-08-2024",
                    messages: [
                        { role: "system", content: systemPrompt(rol, contexto) },
                        ...nuevosMensajes.map((m) => ({ role: m.rol === "user" ? "user" : "assistant", content: m.contenido })),
                    ],
                }),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const respuesta = data.message?.content?.[0]?.text ?? "No pude procesar la respuesta.";
            setMensajes([...nuevosMensajes, { rol: "assistant", contenido: respuesta }]);
        } catch {
            setMensajes([...nuevosMensajes, { rol: "assistant", contenido: "Hubo un error al conectar con el asistente. Intentá de nuevo." }]);
        } finally {
            setCargando(false);
        }
    };

    const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } };

    return (
        <>
            <button
                onClick={() => setAbierto((v) => !v)}
                className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200
                    ${abierto ? "bg-slate-700" : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-110 border border-slate-200 dark:border-slate-600"}`}
                aria-label="Abrir asistente IA"
            >
                {abierto ? <X size={22} className="text-white" /> : <FarmyIcon size={36} />}
            </button>

            {abierto && (
                <div className="fixed bottom-24 right-5 z-50 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden" style={{ maxHeight: "520px" }}>
                    {/* Header */}
                    <div className="bg-blue-600 px-4 py-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <FarmyIcon size={24} />
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm">{titulo[rol]}</p>
                            <p className="text-blue-200 text-xs">Powered by IA · No reemplaza consulta médica</p>
                        </div>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-900" style={{ minHeight: "300px" }}>
                        {mensajes.map((m, i) => (
                            <div key={i} className={`flex gap-2 ${m.rol === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${m.rol === "user" ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}`}>
                                    {m.rol === "user" ? <User size={13} className="text-white" /> : <FarmyIcon size={18} />}
                                </div>
                                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                                    ${m.rol === "user"
                                        ? "bg-blue-600 text-white rounded-tr-sm"
                                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm rounded-tl-sm"
                                    }`}>
                                    {m.contenido}
                                </div>
                            </div>
                        ))}

                        {cargando && (
                            <div className="flex gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <FarmyIcon size={18} />
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl rounded-tl-sm px-3 py-2">
                                    <div className="flex gap-1 items-center h-5">
                                        {[0, 1, 2].map((i) => (
                                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex gap-2 items-center">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder={placeholder[rol]}
                                disabled={cargando}
                                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                            />
                            <button
                                onClick={enviar}
                                disabled={!input.trim() || cargando}
                                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                            >
                                {cargando ? <Loader size={15} className="text-white animate-spin" /> : <Send size={15} className="text-white" />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-300 dark:text-slate-500 text-center mt-2">Solo informativo · No reemplaza consulta médica</p>
                    </div>
                </div>
            )}
        </>
    );
}