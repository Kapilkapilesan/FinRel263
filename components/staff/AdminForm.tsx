import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Save, User, Phone } from 'lucide-react';
import { toast } from 'react-toastify';
import { staffService } from '../../services/staff.service';
import { colors } from '@/themes/colors';
import { SecureImage } from '../common/SecureImage';
import { API_BASE_URL } from '@/services/api.config';

interface AdminFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: {
        id: string | number;
        email: string;
        [key: string]: any;
    };
}

export function AdminForm({ onClose, onSuccess, initialData }: AdminFormProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [phone, setPhone] = useState(initialData?.phone || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(initialData?.avatar || null);

    const isEditing = !!initialData;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Requirement: Max size 1MB
            if (file.size > 1 * 1024 * 1024) {
                toast.error("Image size must be less than 1MB");
                return;
            }
            setImageFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Full Name is required.");
            return;
        }

        if (!email.trim()) {
            setError("Email is required.");
            return;
        }

        if (!isEditing && !password.trim()) {
            setError("Password is required for new accounts.");
            return;
        }

        // Validate password only if provided
        if (password.trim()) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*#?&])/;
            if (password.length < 8 || !passwordRegex.test(password)) {
                setError("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
                return;
            }
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name.toUpperCase());
            formData.append('email', email);
            if (phone) formData.append('phone', phone);
            if (password) formData.append('password', password);
            if (imageFile) formData.append('avatar', imageFile);
            formData.append('role', 'admin');

            if (isEditing && initialData) {
                // For update, we append _method=PUT to handle it as POST-multipart in Laravel
                formData.append('_method', 'PUT');
                await staffService.updateUser(initialData.id, formData);
                toast.success('Admin updated successfully');
            } else {
                await staffService.createAdmin(formData);
                toast.success('Admin created successfully');
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(isEditing ? "Failed to update admin" : "Failed to create admin", err);
            setError(err.message || (isEditing ? 'Failed to update admin' : 'Failed to create admin'));
            toast.error(err.message || (isEditing ? 'Failed to update admin' : 'Failed to create admin'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-card rounded-2xl max-w-md w-full shadow-2xl border border-border-default overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-5 border-b border-border-default flex items-center justify-between bg-card">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">
                            {isEditing ? 'Edit Admin' : 'Create New Admin'}
                        </h2>
                        <p className="text-xs text-text-muted">
                            {isEditing ? 'Update credentials for this administrator.' : 'Enter basic credentials for the new administrator.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-hover rounded-full transition-colors text-text-muted hover:text-text-primary">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6" autoComplete="off">
                    {/* Fake inputs to prevent Chrome autofill */}
                    <input type="text" style={{ display: 'none' }} aria-hidden="true" />
                    <input type="password" style={{ display: 'none' }} aria-hidden="true" />

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-900/50">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Profile Image
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-input border border-border-input group">
                                {previewImage ? (
                                    previewImage.startsWith('blob:') ? (
                                        <img src={previewImage} alt="Profile Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <SecureImage
                                            src={previewImage}
                                            alt="Profile Preview"
                                            className="w-full h-full object-cover"
                                            fallbackName={name}
                                        />
                                    )
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></svg>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleImageChange}
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-text-primary">Upload Photo</p>
                                <p className="text-xs text-text-muted mt-1">Accepts JPG, PNG. Max size 1MB.</p>
                                <button
                                    type="button"
                                    className="mt-2 text-xs font-medium cursor-pointer relative"
                                    style={{ color: colors.primary[600] }}
                                >
                                    Choose File
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleImageChange}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Full Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value.toUpperCase())}
                                className="w-full pl-10 pr-4 py-2 bg-input border border-border-input rounded-lg text-sm focus:border-transparent outline-none transition-all text-text-primary uppercase"
                                style={{ '--tw-ring-color': `${colors.primary[500]}33` } as any}
                                placeholder="Enter full name"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Email Address <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                className="w-full pl-10 pr-4 py-2 bg-input border border-border-input rounded-lg text-sm focus:border-transparent outline-none transition-all text-text-primary"
                                style={{ '--tw-ring-color': `${colors.primary[500]}33` } as any}
                                placeholder="admin@example.com"
                                autoComplete="new-email"
                                required
                            />
                        </div>
                    </div>



                    {!isEditing && (
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2 bg-input border border-border-input rounded-lg text-sm focus:border-transparent outline-none transition-all text-text-primary"
                                    style={{ '--tw-ring-color': `${colors.primary[500]}33` } as any}
                                    placeholder="Enter strong password"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">
                                Must contain 8+ chars, uppercase, lowercase, number, and symbol.
                            </p>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-input border border-border-input rounded-lg text-sm focus:border-transparent outline-none transition-all text-text-primary"
                                style={{ '--tw-ring-color': `${colors.primary[500]}33` } as any}
                                placeholder="Enter phone number"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-input hover:bg-hover border border-border-default text-text-secondary rounded-lg transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            style={{
                                backgroundColor: colors.primary[600],
                                boxShadow: `0 10px 15px -3px ${colors.primary[500]}33`
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primary[700]}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary[600]}
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isEditing ? 'Update Admin' : 'Create Admin'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
