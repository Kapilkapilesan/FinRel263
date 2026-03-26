'use client'

import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Building, Lock, Eye, EyeOff, Key, ShieldCheck, UserCircle, Save, Edit2, X, Camera } from 'lucide-react';
import { authService, User as UserType } from '../../services/auth.service';
import { toast } from 'react-toastify';
import BMSLoader from '../../components/common/BMSLoader';
import { SecureImage } from '../../components/common/SecureImage';
import { API_BASE_URL } from '../../services/api.config';

type Tab = 'profile' | 'password';

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [user, setUser] = useState<UserType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Edit Profile Form
    const [formData, setFormData] = useState({
        full_name: '',
        contact_no: '',
        address: '',
        nic: ''
    });
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Change Password Form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileData = await authService.getProfile();
                setUser(profileData);
                setFormData({
                    full_name: profileData.full_name || '',
                    contact_no: profileData.phone || '',
                    address: profileData.address || '',
                    nic: (profileData as any).nic || ''
                });

                // Check if user is admin or super_admin
                const adminStatus = authService.hasRole('admin') || authService.hasRole('super_admin');
                setIsAdmin(adminStatus);

            } catch (error) {
                console.error('Failed to fetch profile:', error);
                toast.error('Failed to load profile information');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const data = new FormData();
            data.append('full_name', formData.full_name);
            data.append('contact_no', formData.contact_no);
            data.append('address', formData.address);
            data.append('nic', formData.nic);
            if (profileImage) {
                data.append('profile_image_file', profileImage);
            }

            await authService.updateProfile(data);
            toast.success('Profile updated successfully');

            // Refresh data
            const updatedProfile = await authService.getProfile();
            setUser(updatedProfile);
            setIsEditMode(false);

            // Update local storage if needed
            await authService.refreshProfile();

        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (!passwordRegex.test(newPassword)) {
            toast.error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
            return;
        }

        setIsSubmitting(true);
        try {
            await authService.changePassword(user.id, currentPassword, newPassword, confirmPassword);
            toast.success('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
                <BMSLoader message="Loading profile..." size="medium" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-text-primary">
                        Settings
                    </h1>
                    <p className="text-text-secondary font-medium">
                        Configure your digital identity and security preferences.
                    </p>
                </div>

                <div className="bg-muted-bg p-1 rounded-2xl flex gap-1 self-start">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile'
                            ? 'bg-card text-primary-600 shadow-sm'
                            : 'text-text-muted hover:text-text-primary'
                            }`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'password'
                            ? 'bg-card text-primary-600 shadow-sm'
                            : 'text-text-muted hover:text-text-primary'
                            }`}
                    >
                        Security
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar / Profile Card */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-card rounded-[2.5rem] p-8 border border-border-default shadow-xl shadow-gray-200/50 dark:shadow-none text-center relative overflow-hidden group">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-colors"></div>

                        <div className="relative">
                            <div className="inline-flex relative">
                                <div className="w-32 h-32 bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500 overflow-hidden">
                                    {(previewUrl || user?.avatar_url || user?.staff_id || user?.user_name) ? (
                                        <SecureImage
                                            src={previewUrl || (user?.staff_id || user?.user_name ? `${API_BASE_URL}/media/staff-profiles/${user?.staff_id || user?.user_name}` : user?.avatar_url || '')}
                                            alt={user?.full_name || user?.name || user?.user_name}
                                            className="w-full h-full object-cover"
                                            fallbackName={user?.full_name || user?.name}
                                        />
                                    ) : (
                                        <UserCircle className="w-16 h-16 text-white" />
                                    )}

                                    {isEditMode && (
                                        <div
                                            className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="bg-white/90 p-3 rounded-full shadow-lg transform scale-90 hover:scale-100 transition-transform">
                                                <Camera className="text-primary-600 w-6 h-6" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                {isEditMode ? (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-1 -right-1 bg-primary-600 text-white p-2 rounded-xl border-4 border-card shadow-lg hover:bg-primary-700 transition-colors animate-bounce-subtle"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <div className="absolute -bottom-2 -right-2 bg-success-500 w-6 h-6 rounded-full border-4 border-card shadow-sm"></div>
                                )}
                            </div>

                            <div className="mt-6">
                                <h2 className="text-2xl font-bold text-text-primary leading-tight">
                                    {user?.full_name || 'User'}
                                </h2>
                                <p className="text-primary-600 font-bold text-xs uppercase tracking-widest mt-1">
                                    {user?.role_name || 'Staff Member'}
                                </p>
                            </div>

                            <div className="mt-8 pt-8 border-t border-border-divider grid grid-cols-2 gap-4">
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-tighter">Staff ID</p>
                                    <p className="text-sm font-bold text-text-secondary">#{user?.staff_id || '000'}</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-tighter">Status</p>
                                    <p className="text-sm font-bold text-success-600 italic">Verified</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8">
                    <div className="bg-card rounded-[2.5rem] border border-border-default shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden min-h-[500px]">
                        <div className="p-8 md:p-10">
                            {activeTab === 'profile' ? (
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-1 bg-primary-600 rounded-full"></div>
                                            <h3 className="text-xl font-bold text-text-primary">Personal Information</h3>
                                        </div>
                                        {isAdmin && !isEditMode && (
                                            <button
                                                onClick={() => setIsEditMode(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-sm font-bold hover:bg-primary-100 transition-all active:scale-95"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Edit Details
                                            </button>
                                        )}
                                        {isEditMode && (
                                            <button
                                                onClick={() => {
                                                    setIsEditMode(false);
                                                    setPreviewUrl(null);
                                                    setProfileImage(null);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-muted-bg text-text-secondary rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancel
                                            </button>
                                        )}
                                    </div>

                                    <form onSubmit={handleUpdateProfile}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                            <div className="group">
                                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2 mb-2 group-hover:text-primary-500 transition-colors">
                                                    <User className="w-3.5 h-3.5" />
                                                    Full Name
                                                </label>
                                                {isEditMode ? (
                                                    <input
                                                        type="text"
                                                        value={formData.full_name}
                                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                        className="w-full text-base font-semibold text-text-primary bg-muted-bg p-3 rounded-xl border-2 border-transparent focus:border-primary-500 focus:outline-none transition-all"
                                                        required
                                                    />
                                                ) : (
                                                    <div className="text-base font-semibold text-text-primary bg-muted-bg p-3 rounded-xl border border-transparent">
                                                        {user?.full_name || 'N/A'}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="group">
                                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2 mb-2 group-hover:text-primary-500 transition-colors">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    Email Address
                                                </label>
                                                <div className="text-base font-semibold text-text-muted bg-gray-100 p-3 rounded-xl border border-transparent italic">
                                                    {user?.email || 'N/A'}
                                                </div>
                                            </div>

                                            <div className="group">
                                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2 mb-2 group-hover:text-primary-500 transition-colors">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    Phone Number
                                                </label>
                                                {isEditMode ? (
                                                    <input
                                                        type="text"
                                                        value={formData.contact_no}
                                                        onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                                                        className="w-full text-base font-semibold text-text-primary bg-muted-bg p-3 rounded-xl border-2 border-transparent focus:border-primary-500 focus:outline-none transition-all"
                                                        required
                                                    />
                                                ) : (
                                                    <div className="text-base font-semibold text-text-primary bg-muted-bg p-3 rounded-xl border border-transparent">
                                                        {user?.phone || 'N/A'}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="group">
                                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2 mb-2 group-hover:text-primary-500 transition-colors">
                                                    <Building className="w-3.5 h-3.5" />
                                                    Branch location
                                                </label>
                                                <div className="text-base font-semibold text-text-muted bg-gray-100 p-3 rounded-xl border border-transparent italic">
                                                    {user?.branch?.name || 'N/A'}
                                                </div>
                                            </div>

                                            {!isAdmin && (
                                                <div className="md:col-span-2 group">
                                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2 mb-2 group-hover:text-primary-500 transition-colors">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        Residential Address
                                                    </label>
                                                    {isEditMode ? (
                                                        <textarea
                                                            value={formData.address}
                                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                            rows={3}
                                                            className="w-full text-base font-semibold text-text-primary bg-muted-bg p-3 rounded-xl border-2 border-transparent focus:border-primary-500 focus:outline-none transition-all resize-none"
                                                            required
                                                        />
                                                    ) : (
                                                        <div className="text-base font-semibold text-text-primary bg-muted-bg p-4 rounded-xl leading-relaxed">
                                                            {user?.address || 'No address provided'}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {isEditMode && (
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full mt-10 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold shadow-xl shadow-primary-200 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                            >
                                                {isSubmitting ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <Save className="w-5 h-5" />
                                                        Update My Details
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </form>

                                    <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-2xl border border-primary-100 dark:border-primary-900/20 flex gap-4 items-start">
                                        <div className="bg-primary-600 p-2 rounded-lg text-white">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs text-primary-800 dark:text-primary-300 leading-relaxed font-medium">
                                            {isAdmin
                                                ? "As an Admin, you can update your own contact details. System-linked fields like Email and Branch must be updated by the Super Administrator."
                                                : "Your profile is managed by the organization. If any information is incorrect, please raise a ticket with the System Administrator."
                                            }
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-md mx-auto py-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="text-center mb-10">
                                        <h3 className="text-2xl font-bold text-text-primary">Security Update</h3>
                                        <p className="text-text-secondary mt-2">Change your password to keep your account safe.</p>
                                    </div>

                                    <form onSubmit={handleChangePassword} className="space-y-5">
                                        {[
                                            { label: 'Current Password', state: currentPassword, setter: setCurrentPassword, show: showCurrentPassword, toggle: setShowCurrentPassword, icon: Key },
                                            { label: 'New Password', state: newPassword, setter: setNewPassword, show: showNewPassword, toggle: setShowNewPassword, icon: Lock },
                                            { label: 'Confirm New Password', state: confirmPassword, setter: setConfirmPassword, show: showConfirmPassword, toggle: setShowConfirmPassword, icon: Lock }
                                        ].map((field, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <label className="text-xs font-bold text-text-secondary ml-1">{field.label}</label>
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-500 transition-colors">
                                                        <field.icon className="w-4 h-4" />
                                                    </div>
                                                    <input
                                                        type={field.show ? 'text' : 'password'}
                                                        value={field.state}
                                                        onChange={(e) => field.setter(e.target.value)}
                                                        className="w-full pl-12 pr-12 py-3.5 bg-input border-2 border-transparent focus:border-primary-500 rounded-2xl focus:outline-none focus:bg-card transition-all font-medium text-text-primary"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => field.toggle(!field.show)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition-colors"
                                                    >
                                                        {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full mt-6 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold shadow-xl shadow-primary-200 dark:shadow-primary-900/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" />
                                                    Update Security Credentials
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
