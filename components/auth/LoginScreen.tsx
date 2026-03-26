import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Building2, Clock, AlertCircle, Eye, EyeOff, Shield, Users, TrendingUp, ArrowLeft, Mail, CheckCircle, ArrowRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { authService } from '../../services/auth.service';
import { colors } from '@/themes/colors';
import { getInitials } from '../../utils/name.utils';

interface LoginScreenProps {
    onLogin: (username: string, password: string) => Promise<void>;
    initialView?: 'login' | 'forgot-password';
}

type LoginStep = 'username' | 'password';

interface VerifiedUser {
    display_name: string;
    avatar_url?: string;
    username: string;
}

export function LoginScreen({ onLogin, initialView = 'login' }: LoginScreenProps) {
    const [view, setView] = useState<'login' | 'forgot-password'>(initialView);
    const [loginStep, setLoginStep] = useState<LoginStep>('username');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showPassword, setShowPassword] = useState(false);
    const [verifiedUser, setVerifiedUser] = useState<VerifiedUser | null>(null);

    // Login hours: 24/7 access enabled
    const loginStartHour = 0;
    const loginEndHour = 24;

    useEffect(() => {
        // Client-side only date initialization to prevent hydration mismatch
        setCurrentTime(new Date());

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const isWithinLoginHours = () => {
        const hour = currentTime.getHours();
        return hour >= loginStartHour && hour < loginEndHour;
    };

    // Step 1: Verify username
    const handleUsernameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim()) {
            setError('Please enter your username');
            return;
        }

        setLoading(true);

        try {
            const response = await authService.verifyUsername(username);

            if (response.statusCode === 2000 && response.data) {
                setVerifiedUser(response.data);
                setLoginStep('password');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Username verification failed');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Submit password
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isWithinLoginHours()) {
            setError(`Login is only allowed between ${loginStartHour}:00 AM and ${loginEndHour}:00 PM`);
            return;
        }

        if (!password) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);

        try {
            await onLogin(username, password);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    // Go back to username step
    const handleBackToUsername = () => {
        setLoginStep('username');
        setPassword('');
        setError('');
        setVerifiedUser(null);
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            await authService.forgotPassword(email);
            setSuccess(true);
            toast.success('Password reset link sent to your email!');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Reset to login view
    const resetToLogin = () => {
        setView('login');
        setLoginStep('username');
        setUsername('');
        setPassword('');
        setError('');
        setSuccess(false);
        setVerifiedUser(null);
    };

    return (
        <div className="dark h-screen w-full relative overflow-hidden bg-app-background transition-colors duration-500 flex flex-col">
            <Image
                src="/bg_image.png"
                alt="Background"
                fill
                priority
                unoptimized
                className="object-cover object-bottom"
                style={{
                    filter: 'contrast(1.05) brightness(1.02) saturate(1.05)',
                }}
            />
            <div className="absolute inset-0 bg-black/5 dark:bg-black/20"></div>

            {/* Decorative Background Blobs */}
            <div className="absolute top-[10%] left-[10%] w-[30vw] h-[30vw] bg-primary-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[10%] right-[10%] w-[25vw] h-[25vw] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="login-layout-wrapper">
                {/* Left Side - Branding Content (Visible on Desktop) */}
                <div className="login-branding-section">
                    <div className="bg-transparent p-8 lg:p-10 rounded-[2.5rem] transition-all">
                        <div className="inline-flex items-center gap-5 mb-6">
                            <img src="/bms_logo.png" alt="BMS Logo" className="h-20 lg:h-28 w-auto object-contain" />
                        </div>

                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4 leading-tight lg:leading-[1.0] text-slate-900 whitespace-nowrap">
                            Empowering Communities <br />Through Finance
                        </h2>

                        <p className="text-base lg:text-lg font-medium leading-relaxed text-black max-w-xl" style={{
                            WebkitTextStroke: '1px white',
                            paintOrder: 'stroke fill'
                        }}>
                            A comprehensive loan management system designed for microfinance
                            institutions across <br />Sri Lanka.
                        </p>
                    </div>
                </div>

                {/* Right Side - Forms (Pinned Right - Optimized Height) */}
                <div className="login-form-container">
                    <div className="login-card-compact">
                        {/* Mobile Logo Only */}
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl p-4 border border-white/20">
                                <img src="/bms-logo-verified.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>

                        <div className="text-center mb-4">
                            {view === 'login' ? (
                                loginStep === 'username' ? (
                                    <>
                                        <h2 className="text-text-primary mb-2 text-3xl lg:text-4xl font-black tracking-tight">Welcome back</h2>
                                        <p className="text-text-secondary font-medium text-sm">
                                            Please enter your details to access your account
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-center mb-6">
                                            {verifiedUser?.avatar_url ? (
                                                <div className="relative group">
                                                    <div className="absolute -inset-4 bg-primary-500/20 rounded-full blur-2xl group-hover:bg-primary-500/30 transition-all duration-500"></div>
                                                    <img
                                                        src={verifiedUser.avatar_url}
                                                        alt={verifiedUser.display_name}
                                                        className="relative w-24 h-24 rounded-[2.5rem] border-4 border-white/20 shadow-2xl object-cover z-10"
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-2xl border-4 border-white/20 shadow-lg z-20 flex items-center justify-center">
                                                        <CheckCircle className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative group">
                                                    <div className="absolute -inset-4 bg-primary-500/20 rounded-full blur-2xl group-hover:bg-primary-500/30 transition-all duration-500"></div>
                                                    <div className="relative w-24 h-24 rounded-[2.5rem] bg-white/10 backdrop-blur-xl flex items-center justify-center border-4 border-white/20 shadow-2xl z-10">
                                                        <span className="text-3xl font-black text-primary-500 tracking-tighter">
                                                            {getInitials(verifiedUser?.display_name || '')}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <h2 className="text-text-primary mb-1 text-2xl font-black tracking-tight">
                                            Account Verification – BMS
                                        </h2>
                                        <p className="text-primary-500 font-bold text-xl mb-3">
                                            {verifiedUser?.display_name}
                                        </p>
                                        <button
                                            onClick={handleBackToUsername}
                                            className="text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-primary-500 transition-colors flex items-center gap-2 mx-auto"
                                        >
                                            <ArrowLeft className="w-3 h-3" />
                                            Switch Account
                                        </button>
                                    </>
                                )
                            ) : (
                                <>
                                    <h2 className="text-text-primary mb-2 text-3xl font-black tracking-tight">
                                        {success ? 'Check Email' : 'Forgot Password?'}
                                    </h2>
                                    <p className="text-text-secondary font-bold text-xs">
                                        {success
                                            ? "Recovery link sent to your inbox"
                                            : 'Enter your email for the reset link'
                                        }
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Forms Section */}
                        {view === 'login' ? (
                            <div className="space-y-4">
                                {/* Action Bar (Only for username step) */}
                                {loginStep === 'username' && (
                                    <div className={`p-3 rounded-[2rem] mb-4 flex items-center gap-4 backdrop-blur-xl transition-all duration-300 ${isWithinLoginHours()
                                        ? 'bg-blue-500/5 border border-blue-500/20 shadow-lg shadow-blue-500/5'
                                        : 'bg-rose-500/5 border border-rose-500/20 shadow-lg shadow-rose-500/5'}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isWithinLoginHours() ? 'bg-blue-500' : 'bg-rose-500'}`}>
                                            <Clock className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isWithinLoginHours() ? 'text-blue-400' : 'text-rose-400'}`}>
                                                System Status: {isWithinLoginHours() ? 'Online' : 'Restricted'}
                                            </p>
                                            <p className={`text-xs font-bold ${isWithinLoginHours() ? 'text-blue-300/70' : 'text-rose-300/70'}`}>
                                                {currentTime.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <div className="flex flex-col gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                                        </div>
                                        {(error.includes('Account disabled details') || error.includes('locked')) && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setError('');
                                                    setView('forgot-password');
                                                }}
                                                className="self-end text-sm text-red-700 hover:text-red-900 font-semibold underline mt-1"
                                            >
                                                Reset Account
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Step 1: Username Input */}
                                {loginStep === 'username' ? (
                                    <form onSubmit={handleUsernameSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-text-primary font-black text-[10px] ml-2 uppercase tracking-widest">Username or Email</label>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    className="w-full px-6 py-4 bg-white/5 dark:bg-white/[0.03] border border-white/10 rounded-[1.5rem] transition-all font-bold text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/40 backdrop-blur-xl text-sm shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]"
                                                    placeholder="Enter your username"
                                                    disabled={loading}
                                                    autoFocus
                                                />
                                                <User className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between w-full px-2">
                                            <label className="flex items-center gap-3 group cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" className="peer sr-only" />
                                                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/20 backdrop-blur-md transition-all peer-checked:bg-primary-500 peer-checked:border-primary-500 group-hover:border-white/40 shadow-inner"></div>
                                                    <CheckCircle className="absolute inset-0 w-6 h-6 text-white scale-0 peer-checked:scale-75 transition-transform duration-300" />
                                                </div>
                                                <span className="text-xs font-bold text-text-secondary tracking-tight group-hover:text-text-primary transition-colors">Remember me</span>
                                            </label>
                                            <button type="button" onClick={() => setView('forgot-password')} className="text-xs font-bold text-text-secondary hover:text-text-primary transition-colors">Forgot password?</button>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || !username.trim()}
                                            className="group relative w-full bg-primary-500 hover:bg-primary-600 py-4 rounded-[1.5rem] transition-all disabled:opacity-50 shadow-2xl shadow-primary-500/30 active:scale-[0.98] font-black text-white text-base tracking-wider overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[strike_1s_ease-in-out] pointer-events-none"></div>
                                            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-3 border-white/30 border-t-white mx-auto"></div> : 'Sign In'}
                                        </button>
                                    </form>
                                ) : (
                                    /* Step 2: Password Input */
                                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center ml-2">
                                                <label className="block text-text-primary font-black text-[10px] uppercase tracking-widest">Password</label>
                                            </div>
                                            <div className="relative group">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full px-6 py-4 bg-white/5 dark:bg-white/[0.03] border border-white/10 rounded-[1.5rem] transition-all font-bold text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/40 backdrop-blur-xl text-sm shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]"
                                                    placeholder="Enter your password"
                                                    disabled={loading}
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between w-full px-2">
                                            <label className="flex items-center gap-3 group cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" className="peer sr-only" />
                                                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/20 backdrop-blur-md transition-all peer-checked:bg-primary-500 peer-checked:border-primary-500 group-hover:border-white/40 shadow-inner"></div>
                                                    <CheckCircle className="absolute inset-0 w-6 h-6 text-white scale-0 peer-checked:scale-75 transition-transform duration-300" />
                                                </div>
                                                <span className="text-xs font-bold text-text-secondary tracking-tight group-hover:text-text-primary transition-colors">Remember me</span>
                                            </label>
                                            <button type="button" onClick={() => setView('forgot-password')} className="text-xs font-bold text-text-secondary hover:text-text-primary transition-colors">Forgot password?</button>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || !password}
                                            className="group relative w-full bg-primary-500 hover:bg-primary-600 py-4 rounded-[1.5rem] transition-all disabled:opacity-50 shadow-2xl shadow-primary-500/30 active:scale-[0.98] font-black text-white text-base tracking-wider overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[strike_1s_ease-in-out] pointer-events-none"></div>
                                            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-3 border-white/30 border-t-white mx-auto"></div> : 'Sign In'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        ) : (
                            /* Forgot Password View */
                            <div className="space-y-6">
                                {success ? (
                                    <div className="text-center space-y-8 py-4">
                                        <div className="relative group mx-auto w-24 h-24">
                                            <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all duration-500"></div>
                                            <div className="relative w-24 h-24 bg-white/10 border border-white/20 rounded-[2.5rem] flex items-center justify-center text-blue-500 shadow-2xl backdrop-blur-xl z-10 transition-transform group-hover:scale-110">
                                                <CheckCircle className="w-12 h-12" />
                                            </div>
                                        </div>
                                        <p className="text-sm text-text-secondary font-bold leading-relaxed px-4">
                                            We've sent recovery instructions to your registered email address.
                                        </p>
                                        <button onClick={resetToLogin} className="text-xs font-black uppercase tracking-widest text-primary-500 hover:text-primary-600">Return to Sign In</button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleForgotSubmit} className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="block text-text-primary font-black text-[10px] ml-2 uppercase tracking-widest">Registered Email</label>
                                            <div className="relative group">
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full px-6 py-4 bg-white/5 dark:bg-white/[0.03] border border-white/10 rounded-[1.5rem] transition-all font-bold text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/40 backdrop-blur-xl text-sm shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]"
                                                    placeholder="email@company.com"
                                                    required
                                                />
                                                <Mail className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="group relative w-full bg-primary-500 hover:bg-primary-600 py-4 rounded-[1.5rem] transition-all disabled:opacity-50 shadow-2xl shadow-primary-500/30 active:scale-[0.98] font-black text-white text-base tracking-wider overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[strike_1s_ease-in-out] pointer-events-none"></div>
                                            {loading ? 'Requesting...' : 'Request Reset Link'}
                                        </button>
                                        <button onClick={resetToLogin} className="w-full text-xs font-black uppercase tracking-widest text-text-muted text-center hover:text-text-primary transition-colors">Cancel</button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Footer - Joining BMS Capitals (Only for login view) */}
                        {view === 'login' && (
                            <div className="mt-4 text-center space-y-3">
                                {/* <p className="text-text-secondary font-black text-[10px] tracking-widest uppercase opacity-120">Don't have an account?</p> */}
                                <p className="text-black font-black text-[11px] tracking-widest uppercase opacity-80" >Don't have an account?</p>
                                <button
                                    onClick={() => window.open('https://bmscapital.lk/', '_blank')}
                                    className="group relative bg-white/5 border border-white/10 hover:bg-white/10 py-3.5 px-8 rounded-[1.5rem] font-black text-xs text-text-primary flex items-center gap-3 mx-auto transition-all hover:scale-[1.02] active:scale-95 shadow-xl backdrop-blur-xl"
                                >
                                    <div className="bg-primary-500 p-2 rounded-xl text-white shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    Join BMS Capital
                                </button>
                            </div>
                        )}

                        <div className="mt-6 flex justify-center">
                            <div className="px-4 py-1.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 shadow-sm">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] leading-none">
                                    Trust & Reliability since 2024
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Custom Shake Animation for Errors */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                @keyframes strike {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
                /* Hide native password reveal button in Edge and WebKit */
                input::-ms-reveal,
                input::-ms-clear {
                    display: none;
                }
                input::-webkit-contacts-auto-fill-button,
                input::-webkit-credentials-auto-fill-button {
                    visibility: hidden;
                    display: none !important;
                    pointer-events: none;
                    position: absolute;
                    right: 0;
                }
            `}</style>
        </div >
    );
}
