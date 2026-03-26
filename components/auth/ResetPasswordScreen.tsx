import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, Lock, Key } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { authService } from '../../services/auth.service';

export function ResetPasswordScreen() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get token and email from URL parameters
    const token = searchParams.get('token') || '';
    const emailParam = searchParams.get('email') || '';

    const [email] = useState(emailParam);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!password || !passwordConfirmation) {
            setError('Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (password !== passwordConfirmation) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword({
                token,
                email,
                password,
                password_confirmation: passwordConfirmation
            });

            setSuccess(true);
            toast.success('Password reset successfully!');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. Please try again or request a new link.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-app-background flex items-center justify-center p-4 transition-colors duration-500">
                <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl p-8 border border-border-default/50 text-center">
                    <div className="w-16 h-16 bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-success-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Password Reset Successful</h2>
                    <p className="text-text-secondary mb-8">
                        Your account has been unlocked and your password has been updated. You can now log in with your new password.
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-background flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-500">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400/10 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-card rounded-3xl shadow-2xl p-8 sm:p-10 border border-border-default/50">
                    <div className="text-center mb-8">
                        <h2 className="text-text-primary mb-2 text-2xl font-semibold tracking-tight">
                            Reset Password
                        </h2>
                        <p className="text-text-secondary font-medium">
                            Create a strong password for your account
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl mb-6">
                            <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-danger-600 dark:text-danger-400 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field (Read Only) */}
                        <div>
                            <label className="block text-text-primary mb-2 font-medium">Email Address</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    readOnly
                                    className="w-full pl-11 pr-4 py-3 bg-muted-bg border border-border-divider rounded-xl text-text-muted cursor-not-allowed font-normal"
                                />
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-text-primary mb-2 font-medium">New Password</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                                    <Key className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3 bg-input border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-normal text-text-primary"
                                    placeholder="Enter new password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-text-primary mb-2 font-medium">Confirm New Password</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                                    <Key className="w-5 h-5" />
                                </div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3 bg-input border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-normal text-text-primary"
                                    placeholder="Confirm new password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-500 text-white py-3.5 rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 font-semibold"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Resetting...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-border-default rounded-xl hover:bg-hover transition-colors font-semibold text-text-secondary"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
