'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { notificationService } from '../../services/notification.service';
import { Notification } from '../../types/notification.types';
import { toast } from 'react-toastify';

export function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Close on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            const [listRes, countRes] = await Promise.all([
                notificationService.getAll(1, 10, 'all'), // Get latest 10
                notificationService.getUnreadCount()
            ]);
            setNotifications(listRes.data);
            setUnreadCount(countRes.data.unread_count);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    // Initial fetch and periodic polling
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Refresh when opening
            fetchNotifications();
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            // Update local state
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            setIsLoading(true);
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Failed to mark all as read', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await notificationService.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            // If it was unread, decrease count
            const notif = notifications.find(n => n.id === id);
            if (notif && !notif.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            toast.success('Notification removed');
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    const getIconColor = (action: string) => {
        switch (action) {
            case 'completed':
            case 'activated':
            case 'first_approval':
            case 'second_approval':
                return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            case 'pending_1st':
            case 'pending_2nd':
                return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'sent_back':
                return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
            case 'rejected':
                return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="p-2.5 hover:bg-hover rounded-xl transition-colors relative"
            >
                <Bell className="w-5 h-5 text-text-secondary" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-card animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-card rounded-2xl shadow-xl border border-border-default z-50 overflow-hidden flex flex-col max-h-[80vh] transition-colors">
                    <div className="p-4 border-b border-border-divider flex justify-between items-center bg-card/80 backdrop-blur-sm sticky top-0">
                        <div>
                            <h3 className="text-text-primary font-semibold tracking-tight">Notifications</h3>
                            <p className="text-xs text-text-muted font-medium mt-0.5">
                                {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                disabled={isLoading}
                                className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary-500/10 transition-colors"
                            >
                                <Check className="w-3 h-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-text-muted">
                                <div className="w-12 h-12 bg-muted-bg rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Bell className="w-6 h-6 opacity-40" />
                                </div>
                                <p className="font-medium">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`p-4 border-b border-border-divider group transition-all duration-200 ${notif.is_read
                                        ? 'bg-card hover:bg-hover'
                                        : 'bg-primary-500/5 hover:bg-primary-500/10'
                                        }`}
                                    onClick={() => handleMarkAsRead(notif.id)}
                                >
                                    <div className="flex gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.is_read
                                            ? 'bg-gray-300 dark:bg-gray-600'
                                            : 'bg-blue-500 shadow-sm shadow-blue-500/50'
                                            }`}></div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm font-semibold truncate pr-2 ${notif.is_read
                                                    ? 'text-text-secondary'
                                                    : 'text-text-primary'
                                                    }`}>
                                                    {notif.title}
                                                </h4>
                                                <span className="text-[10px] text-text-muted whitespace-nowrap flex-shrink-0">
                                                    {notif.time_ago}
                                                </span>
                                            </div>

                                            <p className={`text-xs leading-relaxed line-clamp-2 ${notif.is_read
                                                ? 'text-text-muted'
                                                : 'text-text-secondary font-medium'
                                                }`}>
                                                {notif.message}
                                            </p>

                                            {(notif.reason) && (
                                                <div className="mt-2 p-2 bg-muted-bg rounded-lg text-xs italic text-text-muted border border-border-divider">
                                                    "{notif.reason}"
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={(e) => handleDelete(e, notif.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all self-start"
                                            title="Delete notification"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
