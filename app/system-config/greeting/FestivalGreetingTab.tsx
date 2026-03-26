import React, { useState, useEffect } from 'react';
import { festivalService, Festival } from '@/services/festival.service';
import { AlertCircle, Plus, Trash2, Edit2, Calendar, Smartphone } from 'lucide-react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

export function FestivalGreetingTab() {
    const [festivals, setFestivals] = useState<Festival[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentFestival, setCurrentFestival] = useState<Partial<Festival>>({
        name: '',
        celebration_date: '',
        message_template: ''
    });
    const [previewVars, setPreviewVars] = useState({
        staff_name: 'John Doe',
        customer_name: 'Jane Smith',
        branch_name: 'Central Branch',
        festival_name: 'Deepavali'
    });

    useEffect(() => {
        fetchFestivals();
    }, []);

    const fetchFestivals = async () => {
        try {
            const data = await festivalService.getFestivals();
            setFestivals(data);
        } catch (error) {
            toast.error('Failed to load festivals');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentFestival.name || !currentFestival.celebration_date || !currentFestival.message_template) {
            toast.error('Please fill all fields');
            return;
        }

        setIsLoading(true);
        try {
            if (currentFestival.id) {
                await festivalService.updateFestival(currentFestival.id, currentFestival as any);
                toast.success('Festival updated successfully');
            } else {
                await festivalService.createFestival(currentFestival as any);
                toast.success('Festival created successfully');
            }
            setIsEditing(false);
            setCurrentFestival({ name: '', celebration_date: '', message_template: '' });
            fetchFestivals();
        } catch (error) {
            toast.error('Failed to save festival');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this festival?')) {
            try {
                await festivalService.deleteFestival(id);
                toast.success('Festival deleted');
                fetchFestivals();
            } catch (error) {
                toast.error('Failed to delete festival');
            }
        }
    };

    const renderPreview = (template: string, type: 'staff' | 'customer') => {
        let parsed = template;
        parsed = parsed.replace(/{branch_name}/g, `<span class="text-primary-600 font-semibold bg-primary-50 px-1 rounded">${previewVars.branch_name}</span>`);
        parsed = parsed.replace(/{festival_name}/g, `<span class="text-orange-600 font-semibold bg-orange-50 px-1 rounded">${currentFestival.name || previewVars.festival_name}</span>`);

        if (type === 'staff') {
            parsed = parsed.replace(/{staff_name}/g, `<span class="text-primary-600 font-semibold bg-primary-50 px-1 rounded">${previewVars.staff_name}</span>`);
        } else {
            parsed = parsed.replace(/{customer_name}/g, `<span class="text-primary-600 font-semibold bg-primary-50 px-1 rounded">${previewVars.customer_name}</span>`);
        }

        return (
            <div className="bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden flex flex-col h-full ring-1 ring-border-default">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 border-b border-border-default flex items-center justify-between">
                    <div className="flex items-center gap-2 text-text-secondary text-xs">
                        <Smartphone className="w-4 h-4" />
                        <span>SMS Preview ({type})</span>
                    </div>
                    <span className="text-xs text-text-muted">8:00 AM</span>
                </div>
                <div className="p-4 bg-app-background flex-1 text-sm font-medium text-text-primary leading-relaxed" dangerouslySetInnerHTML={{ __html: parsed }} />
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left Column: Form & Previews */}
            <div className="xl:col-span-7 space-y-6">

                {/* Form Container */}
                <div className="bg-surface p-6 rounded-3xl border border-border-default shadow-sm">
                    <div className="flex items-center justify-between mb-6 border-b border-border-default pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">
                                {isEditing ? (currentFestival.id ? 'Edit Festival' : 'New Festival') : 'Festival Setup'}
                            </h2>
                            <p className="text-sm text-text-secondary">Configure automated SMS greetings for special occasions.</p>
                        </div>
                        {!isEditing && (
                            <button
                                onClick={() => { setIsEditing(true); setCurrentFestival({ name: '', celebration_date: '', message_template: '' }); }}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Create New
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleSave} className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">Festival Name</label>
                                    <input
                                        type="text"
                                        value={currentFestival.name}
                                        onChange={(e) => setCurrentFestival({ ...currentFestival, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-app-background border border-border-default rounded-xl focus:ring-2 focus:ring-primary-500 text-sm"
                                        placeholder="e.g., Deepavali, Thai Pongal"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">Celebration Date</label>
                                    <input
                                        type="date"
                                        value={currentFestival.celebration_date ? dayjs(currentFestival.celebration_date).format('YYYY-MM-DD') : ''}
                                        onChange={(e) => setCurrentFestival({ ...currentFestival, celebration_date: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-app-background border border-border-default rounded-xl focus:ring-2 focus:ring-primary-500 text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-text-secondary mb-1.5 flex justify-between items-end">
                                    <span>Message Template</span>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">Automated SMS</span>
                                </label>
                                <p className="text-xs text-text-muted mb-2 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Available dynamic tags: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-primary-600">{'{festival_name}'}</code> <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-primary-600">{'{staff_name}'}</code> <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-primary-600">{'{customer_name}'}</code> <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-primary-600">{'{branch_name}'}</code>
                                </p>
                                <textarea
                                    value={currentFestival.message_template}
                                    onChange={(e) => setCurrentFestival({ ...currentFestival, message_template: e.target.value })}
                                    className="w-full h-32 p-4 bg-app-background border border-border-default rounded-xl focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                                    placeholder="Wishing you a joyous {festival_name}, {customer_name}! From {branch_name} family."
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setCurrentFestival({ name: '', celebration_date: '', message_template: '' }); }}
                                    className="px-5 py-2.5 text-text-secondary hover:bg-hover rounded-xl font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition-all active:scale-95"
                                >
                                    {isLoading ? 'Saving...' : 'Save Template'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center bg-app-background rounded-2xl border border-dashed border-border-default">
                            <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mb-4">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-1">No Active Form</h3>
                            <p className="text-sm text-text-secondary max-w-sm mb-6">Select a festival from the list to edit, or create a new template by clicking the button above.</p>
                            <button
                                onClick={() => { setIsEditing(true); setCurrentFestival({ name: '', celebration_date: '', message_template: '' }); }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-border-default hover:bg-hover text-text-primary rounded-xl font-bold shadow-sm transition-all"
                            >
                                <Plus className="w-4 h-4 text-primary-600" />
                                Draft New Template
                            </button>
                        </div>
                    )}
                </div>

                {/* Live Previews - Only show if editing and has template */}
                {isEditing && currentFestival.message_template && (
                    <div className="bg-surface p-6 rounded-3xl border border-border-default shadow-sm animate-in fade-in duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-primary-500" />
                                Live Device Preview
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-48">
                            {renderPreview(currentFestival.message_template, 'staff')}
                            {renderPreview(currentFestival.message_template, 'customer')}
                        </div>
                    </div>
                )}

            </div>

            {/* Right Column: Festival List */}
            <div className="xl:col-span-5 relative">
                <div className="sticky top-6">
                    <div className="bg-surface rounded-3xl border border-border-default shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
                        <div className="p-5 border-b border-border-default bg-gray-50/50 dark:bg-gray-800/20 backdrop-blur-md">
                            <h3 className="font-bold text-text-primary flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary-600" />
                                Upcoming Festivals
                                <span className="ml-auto bg-primary-100 text-primary-700 text-xs py-0.5 px-2.5 rounded-full">{festivals.length} active</span>
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2 [scrollbar-width:thin]">
                            {festivals.length === 0 ? (
                                <div className="text-center py-10 text-text-muted text-sm">
                                    No festivals configured yet.
                                </div>
                            ) : (
                                festivals.map((festival) => (
                                    <div
                                        key={festival.id}
                                        className={`group relative p-4 rounded-2xl border transition-all ${currentFestival.id === festival.id
                                                ? 'bg-primary-50/50 border-primary-200 shadow-sm'
                                                : 'bg-app-background border-border-default hover:border-primary-200 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-text-primary mb-1">{festival.name}</h4>
                                                <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                                                    <span className="bg-surface px-2 py-0.5 border border-border-default rounded shadow-sm text-primary-600">
                                                        {dayjs(festival.celebration_date).format('MMMM D, YYYY')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setCurrentFestival(festival);
                                                        setIsEditing(true);
                                                    }}
                                                    className="p-1.5 text-text-muted hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(festival.id)}
                                                    className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-border-default/50">
                                            <p className="text-xs text-text-secondary line-clamp-2 italic leading-relaxed">
                                                "{festival.message_template}"
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
