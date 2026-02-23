'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, User, Lock, ArrowRight, UserPlus, Briefcase, CheckCircle, AlertCircle } from 'lucide-react';

const MAX_ATTEMPTS = 3;

export default function LoginPage() {
    const { login } = useAuth();

    const [doorOpen, setDoorOpen] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // --- Login State ---
    const [loginCredential, setLoginCredential] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [usersWithCodes, setUsersWithCodes] = useState([]); // [{ username, employeeCode }]

    // --- Register State ---
    const [regCode, setRegCode] = useState('');
    const [regPass, setRegPass] = useState('');
    const [regPassConfirm, setRegPassConfirm] = useState('');
    const [lookupResult, setLookupResult] = useState(null);  // { name, type } from API
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState('');

    // Animated background cookies
    const [cookies, setCookies] = useState([]);

    useEffect(() => {
        setCookies([...Array(5)].map(() => ({
            x: Math.random() * 1000,
            y: -100,
            size: 40 + Math.random() * 40,
            duration: 10 + Math.random() * 10
        })));

        // Load users with codes for login autocomplete
        fetch('/api/auth/users-with-codes')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setUsersWithCodes(data); })
            .catch(err => console.error('Error fetching users', err));
    }, []);

    // ─── Register: lookup employee by code ─────────────────────────────────────
    const lookupEmployee = useCallback(async (code) => {
        if (!code || code.length < 2) {
            setLookupResult(null);
            setLookupError('');
            return;
        }
        setLookupLoading(true);
        setLookupError('');
        setLookupResult(null);
        try {
            const res = await fetch(`/api/employees/lookup?code=${encodeURIComponent(code)}`);
            const data = await res.json();
            if (data.success) {
                setLookupResult(data);
            } else {
                setLookupError(data.message);
            }
        } catch {
            setLookupError('Error de conexión');
        } finally {
            setLookupLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (regCode) lookupEmployee(regCode);
        }, 500); // debounce 500ms
        return () => clearTimeout(timer);
    }, [regCode, lookupEmployee]);

    // ─── No need for separate autocompletes anymore, as the backend cross-references ───

    // ─── Login Submit ──────────────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        if (failedAttempts >= MAX_ATTEMPTS) return;
        setLoading(true);
        setError('');
        const res = await login(loginCredential, loginPassword);
        if (!res.success) {
            const newAttempts = failedAttempts + 1;
            setFailedAttempts(newAttempts);
            if (newAttempts >= MAX_ATTEMPTS) {
                setError('');
            } else {
                setError(res.message + ` (Intento ${newAttempts} de ${MAX_ATTEMPTS})`);
            }
        }
        setLoading(false);
    };

    // ─── Register Submit ───────────────────────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!lookupResult) { setError('Ingresa un código de empleado válido.'); return; }
        if (regPass !== regPassConfirm) { setError('Las contraseñas no coinciden.'); return; }
        if (regPass.length < 4) { setError('La contraseña debe tener al menos 4 caracteres.'); return; }
        setLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: regPass, employeeCode: regCode })
            });
            const data = await res.json();
            if (data.success) {
                setSuccessMsg(`¡Cuenta creada para ${lookupResult.name}! Ya puedes iniciar sesión.`);
                setIsLogin(true);
                // Pre-fill the credential with the code (or name)
                setLoginCredential(regCode);
                setLoginPassword('');
                // refresh user list
                fetch('/api/auth/users-with-codes')
                    .then(r => r.json())
                    .then(d => { if (Array.isArray(d)) setUsersWithCodes(d); });
            } else {
                setError(data.message);
            }
        } catch { setError('Error de conexión'); } finally { setLoading(false); }
    };

    const switchTab = (toLogin) => {
        setIsLogin(toLogin);
        setError('');
        setSuccessMsg('');
        setLookupResult(null);
        setLookupError('');
        setRegCode('');
        setRegPass('');
        setRegPassConfirm('');
    };

    const isBlocked = failedAttempts >= MAX_ATTEMPTS;

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cookie-dark">
            {/* Background Video/Overlay */}
            <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${doorOpen ? 'opacity-40' : 'opacity-80'}`}>
                <video autoPlay loop muted className="w-full h-full object-cover" poster="/assets/cookie-bg-placeholder.jpg">
                    <source src="/assets/factory-loop.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-cookie-dark/60 to-cookie-brand/60" />
            </div>

            {/* Floating Cookies */}
            {doorOpen && (
                <div className="absolute inset-0 z-0 pointer-events-none">
                    {cookies.map((c, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: c.y, x: c.x, rotate: 0 }}
                            animate={{ y: 1000, rotate: 360 }}
                            transition={{ duration: c.duration, repeat: Infinity, ease: "linear" }}
                            className="absolute opacity-20 text-cookie-light"
                        >
                            <Cookie size={c.size} />
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence mode="wait">
                {!doorOpen ? (
                    /* --- FACTORY ENTRANCE VIEW --- */
                    <motion.div
                        key="entrance"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10 flex flex-col items-center justify-center cursor-pointer group"
                        onClick={() => setDoorOpen(true)}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 drop-shadow-2xl text-center tracking-wider uppercase font-serif">
                            Grupo<br /><span className="text-cookie-accent">Superior</span>
                        </h1>

                        <div className="relative w-64 h-80 md:w-80 md:h-96 hover:scale-105 transition-transform duration-500">
                            <svg viewBox="0 0 200 300" className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                <rect x="10" y="10" width="180" height="280" rx="5" fill="#3e2723" stroke="#5d4037" strokeWidth="5" />
                                <motion.g className="origin-left" whileHover={{ rotateY: -15, x: -5 }} transition={{ type: "spring", stiffness: 100 }}>
                                    <rect x="20" y="20" width="80" height="260" fill="#5d4037" stroke="#3e2723" strokeWidth="2" />
                                    <rect x="30" y="40" width="60" height="80" fill="#4e342e" />
                                    <rect x="30" y="140" width="60" height="120" fill="#4e342e" />
                                    <circle cx="90" cy="150" r="5" fill="#ffab91" />
                                </motion.g>
                                <motion.g style={{ transformOrigin: "180px 0" }} whileHover={{ rotateY: 15, x: 5 }} transition={{ type: "spring", stiffness: 100 }}>
                                    <rect x="100" y="20" width="80" height="260" fill="#5d4037" stroke="#3e2723" strokeWidth="2" />
                                    <rect x="110" y="40" width="60" height="80" fill="#4e342e" />
                                    <rect x="110" y="140" width="60" height="120" fill="#4e342e" />
                                    <circle cx="110" cy="150" r="5" fill="#ffab91" />
                                </motion.g>
                                <rect x="50" y="-10" width="100" height="40" rx="5" fill="#8d6e63" stroke="#3e2723" strokeWidth="2" />
                                <text x="100" y="15" textAnchor="middle" fill="#3e2723" fontSize="12" fontWeight="bold">ENTRADA</text>
                            </svg>
                            <div className="absolute -bottom-10 left-0 w-full text-center text-white/80 text-sm animate-pulse">
                                Toca la puerta para ingresar
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* --- LOGIN / REGISTER FORM --- */
                    <motion.div
                        key="login"
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="relative z-10 w-full max-w-md p-8 glass-panel rounded-2xl mx-4"
                    >
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-serif font-bold text-cookie-dark mb-1">Grupo Superior</h1>
                            <p className="text-cookie-brand font-medium">
                                {isLogin ? 'Acceso a Planta' : 'Activación de Cuenta'}
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="flex mb-6 border-b border-gray-200">
                            <button onClick={() => switchTab(true)} className={`flex-1 pb-2 text-sm font-medium transition-colors ${isLogin ? 'text-cookie-brand border-b-2 border-cookie-brand' : 'text-gray-400 hover:text-gray-600'}`}>
                                Ingreso
                            </button>
                            <button onClick={() => switchTab(false)} className={`flex-1 pb-2 text-sm font-medium transition-colors ${!isLogin ? 'text-cookie-brand border-b-2 border-cookie-brand' : 'text-gray-400 hover:text-gray-600'}`}>
                                Activar Cuenta
                            </button>
                        </div>

                        {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm text-center">{successMsg}</div>}
                        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">{error}</div>}

                        {isLogin ? (
                            /* ═══════════════ INGRESO ═══════════════ */
                            isBlocked ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-6 space-y-4"
                                >
                                    <AlertCircle className="w-14 h-14 text-red-500 mx-auto" />
                                    <p className="text-red-700 font-semibold">Acceso bloqueado</p>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Has superado el número de intentos permitidos.<br />
                                        Por favor, <strong>acércate al administrador</strong> para recuperar tu contraseña.
                                    </p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleLogin} className="space-y-4">
                                    {/* Nombre o Código */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-cookie-dark">Nombre Completo o Código</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-cookie-brand h-5 w-5" />
                                            <input
                                                type="text"
                                                value={loginCredential}
                                                onChange={e => setLoginCredential(e.target.value)}
                                                className="input-field !pl-12"
                                                placeholder="Ej. admin, EMP001, Juan Perez..."
                                                list="credentials-list"
                                                required
                                            />
                                            <datalist id="credentials-list">
                                                {usersWithCodes.map((u, i) => (
                                                    <option key={i} value={u.username} label={u.employeeCode} />
                                                ))}
                                                {usersWithCodes.filter(u => u.employeeCode).map((u, i) => (
                                                    <option key={`code-${i}`} value={u.employeeCode} label={u.username} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>

                                    {/* Contraseña */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-cookie-dark">Contraseña</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-cookie-brand h-5 w-5" />
                                            <input
                                                type="password"
                                                value={loginPassword}
                                                onChange={e => setLoginPassword(e.target.value)}
                                                className="input-field !pl-12"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Intentos restantes */}
                                    {failedAttempts > 0 && (
                                        <p className="text-xs text-center text-amber-600">
                                            {MAX_ATTEMPTS - failedAttempts} intento(s) restante(s) antes del bloqueo
                                        </p>
                                    )}

                                    <button type="submit" disabled={loading} className="w-full cookie-button flex items-center justify-center gap-2 group mt-2">
                                        {loading ? 'Ingresando...' : 'Entrar'}
                                        {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                                    </button>
                                </form>
                            )
                        ) : (
                            /* ═══════════════ ACTIVAR CUENTA ═══════════════ */
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg">
                                    Ingresa el código que te proporcionó RRHH para activar tu acceso.
                                </div>

                                {/* Código */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-cookie-dark">Código de Empleado</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-cookie-brand h-5 w-5" />
                                        <input
                                            type="text"
                                            value={regCode}
                                            onChange={e => { setRegCode(e.target.value); setLookupResult(null); setLookupError(''); }}
                                            className={`input-field !pl-12 transition-colors ${lookupResult ? 'border-green-400 focus:border-green-500' : lookupError ? 'border-red-400' : ''}`}
                                            placeholder="Ej. 5890"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Employee confirmation card */}
                                <AnimatePresence>
                                    {lookupLoading && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-gray-400 text-center py-1">
                                            Buscando empleado...
                                        </motion.div>
                                    )}
                                    {lookupError && (
                                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            {lookupError}
                                        </motion.div>
                                    )}
                                    {lookupResult && (
                                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                            <div>
                                                <p className="font-semibold text-green-800 text-sm">{lookupResult.name}</p>
                                                <p className="text-xs text-green-600">{lookupResult.type || 'Colaborador'}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Nueva Contraseña */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-cookie-dark">Nueva Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-cookie-brand h-5 w-5" />
                                        <input
                                            type="password"
                                            value={regPass}
                                            onChange={e => setRegPass(e.target.value)}
                                            className="input-field !pl-12"
                                            placeholder="Mínimo 4 caracteres"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Confirmar Contraseña */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-cookie-dark">Confirmar Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-cookie-brand h-5 w-5" />
                                        <input
                                            type="password"
                                            value={regPassConfirm}
                                            onChange={e => setRegPassConfirm(e.target.value)}
                                            className={`input-field !pl-12 ${regPassConfirm && regPass !== regPassConfirm ? 'border-red-400' : regPassConfirm && regPass === regPassConfirm ? 'border-green-400' : ''}`}
                                            placeholder="Repite la contraseña"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !lookupResult || !regPass || regPass !== regPassConfirm}
                                    className="w-full cookie-button flex items-center justify-center gap-2 group bg-green-600 hover:bg-green-700 hover:shadow-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Creando cuenta...' : 'Activar mi Cuenta'}
                                    {!loading && <UserPlus className="h-4 w-4" />}
                                </button>
                            </form>
                        )}

                        <div className="absolute -bottom-16 left-0 right-0 text-center">
                            <button onClick={() => setDoorOpen(false)} className="text-white/60 hover:text-white text-sm underline">
                                Volver a la Entrada
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
