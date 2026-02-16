'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, User, Lock, ArrowRight, UserPlus, Briefcase } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();

    // State
    const [doorOpen, setDoorOpen] = useState(false); // Controls the entrance animation
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Login State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Register State
    const [regCode, setRegCode] = useState('');
    const [regUser, setRegUser] = useState('');
    const [regPass, setRegPass] = useState('');

    // Data for Autocomplete
    const [userList, setUserList] = useState([]);
    const [cookies, setCookies] = useState([]);

    useEffect(() => {
        setCookies([...Array(5)].map(() => ({
            x: Math.random() * 1000,
            y: -100,
            size: 40 + Math.random() * 40,
            duration: 10 + Math.random() * 10
        })));

        fetch('/api/auth/users')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setUserList(data); })
            .catch(err => console.error("Error fetching users", err));
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const res = await login(username, password);
        if (!res.success) {
            setError(res.message);
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: regUser, password: regPass, employeeCode: regCode })
            });
            const data = await res.json();
            if (data.success) {
                setSuccessMsg('¡Cuenta creada! Ya puedes iniciar sesión.');
                setIsLogin(true);
                setUsername(regUser);
                setPassword('');
                setUserList(prev => [...prev, regUser]);
            } else { setError(data.message); }
        } catch (err) { setError('Error de conexión'); } finally { setLoading(false); }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cookie-dark">
            {/* Background Video/Overlay */}
            <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${doorOpen ? 'opacity-40' : 'opacity-80'}`}>
                <video autoPlay loop muted className="w-full h-full object-cover" poster="/assets/cookie-bg-placeholder.jpg">
                    <source src="/assets/factory-loop.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-cookie-dark/60 to-cookie-brand/60" />
            </div>

            {/* Floating Cookies Animation */}
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
                            {/* Simple SVG Factory Door */}
                            <svg viewBox="0 0 200 300" className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                {/* Frame */}
                                <rect x="10" y="10" width="180" height="280" rx="5" fill="#3e2723" stroke="#5d4037" strokeWidth="5" />
                                {/* Left Door */}
                                <motion.g
                                    className="origin-left"
                                    whileHover={{ rotateY: -15, x: -5 }}
                                    transition={{ type: "spring", stiffness: 100 }}
                                >
                                    <rect x="20" y="20" width="80" height="260" fill="#5d4037" stroke="#3e2723" strokeWidth="2" />
                                    {/* Panels */}
                                    <rect x="30" y="40" width="60" height="80" fill="#4e342e" />
                                    <rect x="30" y="140" width="60" height="120" fill="#4e342e" />
                                    {/* Handle */}
                                    <circle cx="90" cy="150" r="5" fill="#ffab91" />
                                </motion.g>
                                {/* Right Door */}
                                <motion.g
                                    className="origin-right"
                                    style={{ transformOrigin: "180px 0" }} // Correction for SVG origin
                                    whileHover={{ rotateY: 15, x: 5 }}
                                    transition={{ type: "spring", stiffness: 100 }}
                                >
                                    <rect x="100" y="20" width="80" height="260" fill="#5d4037" stroke="#3e2723" strokeWidth="2" />
                                    {/* Panels */}
                                    <rect x="110" y="40" width="60" height="80" fill="#4e342e" />
                                    <rect x="110" y="140" width="60" height="120" fill="#4e342e" />
                                    {/* Handle */}
                                    <circle cx="110" cy="150" r="5" fill="#ffab91" />
                                </motion.g>
                                {/* Sign */}
                                <rect x="50" y="-10" width="100" height="40" rx="5" fill="#8d6e63" stroke="#3e2723" strokeWidth="2" />
                                <text x="100" y="15" textAnchor="middle" fill="#3e2723" fontSize="12" fontWeight="bold">ENTRADA</text>
                            </svg>

                            <div className="absolute -bottom-10 left-0 w-full text-center text-white/80 text-sm animate-pulse">
                                Toca la puerta para ingresar
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* --- LOGIN FORM --- */
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
                                {isLogin ? 'Acceso a Planta' : 'Registro de Personal'}
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="flex mb-6 border-b border-gray-200">
                            <button onClick={() => { setIsLogin(true); setError(''); }} className={`flex-1 pb-2 text-sm font-medium transition-colors ${isLogin ? 'text-cookie-brand border-b-2 border-cookie-brand' : 'text-gray-400 hover:text-gray-600'}`}>Ingreso</button>
                            <button onClick={() => { setIsLogin(false); setError(''); }} className={`flex-1 pb-2 text-sm font-medium transition-colors ${!isLogin ? 'text-cookie-brand border-b-2 border-cookie-brand' : 'text-gray-400 hover:text-gray-600'}`}>Registro</button>
                        </div>

                        {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm text-center">{successMsg}</div>}
                        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">{error}</div>}

                        {isLogin ? (
                            <form onSubmit={handleLogin} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-cookie-dark">Usuario</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cookie-brand h-5 w-5" />
                                        <input type="text" list="usernames" value={username} onChange={(e) => setUsername(e.target.value)} className="input-field !pl-12" placeholder="Selecciona o escribe..." required />
                                        <datalist id="usernames">{userList.map(u => <option key={u} value={u} />)}</datalist>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-cookie-dark">Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cookie-brand h-5 w-5" />
                                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field !pl-12" placeholder="••••••••" required />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full cookie-button flex items-center justify-center gap-2 group">{loading ? 'Ingresando...' : 'Entrar'} {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}</button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg mb-4">Ingresa el código que te proporcionó RRHH.</div>
                                <div className="space-y-2"><label className="text-sm font-medium text-cookie-dark">Código de Empleado</label><div className="relative"><Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cookie-brand h-5 w-5" /><input type="text" value={regCode} onChange={(e) => setRegCode(e.target.value)} className="input-field !pl-12" placeholder="Ej. EMP005" required /></div></div>
                                <div className="space-y-2"><label className="text-sm font-medium text-cookie-dark">Nuevo Usuario</label><div className="relative"><User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cookie-brand h-5 w-5" /><input type="text" value={regUser} onChange={(e) => setRegUser(e.target.value)} className="input-field !pl-12" placeholder="Elige un usuario" required /></div></div>
                                <div className="space-y-2"><label className="text-sm font-medium text-cookie-dark">Nueva Contraseña</label><div className="relative"><Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cookie-brand h-5 w-5" /><input type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)} className="input-field !pl-12" placeholder="Crea una contraseña" required /></div></div>
                                <button type="submit" disabled={loading} className="w-full cookie-button flex items-center justify-center gap-2 group bg-green-600 hover:bg-green-700 hover:shadow-green-900/50">{loading ? 'Creando...' : 'Crear Cuenta'} {!loading && <UserPlus className="h-4 w-4" />}</button>
                            </form>
                        )}
                        <div className="absolute -bottom-16 left-0 right-0 text-center">
                            <button onClick={() => setDoorOpen(false)} className="text-white/60 hover:text-white text-sm underline">Volver a la Entrada</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

