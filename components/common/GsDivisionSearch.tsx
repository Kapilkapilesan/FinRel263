"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, ChevronDown, X, Search } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface GsDivisionOption {
    id: number;
    name: string;
    mpa_code: string;
    province: string;
}

interface GsDivisionSearchProps {
    label?: string;
    value: string;
    gs_division_id?: number | null;
    onChange: (division: { name: string; id: number | null; province?: string }) => void;
    onManualChange?: (value: string) => void;
    error?: string;
    required?: boolean;
    placeholder?: string;
}

export default function GsDivisionSearch({
    label = "Grama Sevaka Division",
    value,
    gs_division_id,
    onChange,
    onManualChange,
    error,
    required = false,
    placeholder = "Search by name or MPA code...",
}: GsDivisionSearchProps) {
    const [inputValue, setInputValue] = useState(value || "");
    const [suggestions, setSuggestions] = useState<GsDivisionOption[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(gs_division_id || null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Sync external value changes
    useEffect(() => {
        setInputValue(value || "");
    }, [value]);

    useEffect(() => {
        setSelectedId(gs_division_id || null);
    }, [gs_division_id]);

    // Search API
    const searchDivisions = useCallback(async (query: string) => {
        if (query.length < 1) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/gs-divisions/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    Accept: "application/json",
                },
            });
            const json = await res.json();
            if (json.status === "success") {
                setSuggestions(json.data || []);
            }
        } catch {
            // Silently fail — user can still type manually
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle input changes with debounce
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        setSelectedId(null); // Clear selection when typing

        // Notify parent of manual change
        if (onManualChange) {
            onManualChange(val);
        } else {
            onChange({ name: val, id: null });
        }

        // Debounced search
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchDivisions(val);
            if (val.length >= 1) {
                setShowDropdown(true);
            }
        }, 300);
    };

    // Select a suggestion
    const handleSelect = (option: GsDivisionOption) => {
        setInputValue(option.name);
        setSelectedId(option.id);
        setShowDropdown(false);
        setSuggestions([]);
        onChange({
            name: option.name,
            id: option.id,
            province: option.province,
        });
    };

    // Clear selection
    const handleClear = () => {
        setInputValue("");
        setSelectedId(null);
        setSuggestions([]);
        setShowDropdown(false);
        onChange({ name: "", id: null });
        inputRef.current?.focus();
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Highlight matched text
    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <span className="text-primary-600 font-black bg-primary-500/10 rounded px-0.5">
                    {text.slice(idx, idx + query.length)}
                </span>
                {text.slice(idx + query.length)}
            </>
        );
    };

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block opacity-60">
                    <MapPin size={12} className="inline mr-1.5 text-primary-500" />
                    {label}
                    {required && <span className="text-rose-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (suggestions.length > 0) setShowDropdown(true);
                    }}
                    placeholder={placeholder}
                    className={`w-full pl-4 pr-10 py-3 bg-muted-bg/20 border ${error
                        ? "border-rose-500/50 focus:ring-rose-500/30"
                        : selectedId
                            ? "border-emerald-500/50 focus:ring-emerald-500/30"
                            : "border-border-default focus:ring-primary-500/30"
                        } rounded-2xl text-sm font-bold text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 transition-all`}
                />

                {/* Right-side indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {loading && (
                        <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                    )}
                    {inputValue && !loading && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 hover:bg-muted-bg rounded-full transition-colors"
                        >
                            <X className="w-3.5 h-3.5 text-text-muted" />
                        </button>
                    )}
                    {selectedId && (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Selected badge */}
            {selectedId && (
                <div className="flex items-center gap-1.5 mt-1.5 ml-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                        <MapPin className="w-2.5 h-2.5" />
                        Linked to GS Division
                    </span>
                </div>
            )}

            {/* Error message */}
            {error && (
                <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest ml-3 mt-1 animate-pulse">
                    {error}
                </p>
            )}

            {/* Dropdown suggestions */}
            {showDropdown && (suggestions.length > 0 || (inputValue.length >= 1 && !loading)) && (
                <div className="absolute z-50 w-full mt-2 bg-card border border-border-default rounded-2xl shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {suggestions.length > 0 ? (
                        <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                            {suggestions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className="w-full text-left px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors flex items-center justify-between gap-3 border-b border-border-divider/20 last:border-b-0"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-text-primary truncate">
                                            {highlightMatch(option.name, inputValue)}
                                        </p>
                                        <p className="text-[10px] text-text-muted font-bold mt-0.5">
                                            {option.province}
                                        </p>
                                    </div>
                                    <span className="shrink-0 inline-flex items-center px-2.5 py-1 bg-primary-500/10 text-primary-600 rounded-lg text-[10px] font-black tracking-wide">
                                        {highlightMatch(option.mpa_code, inputValue)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 py-4 text-center">
                            <p className="text-xs text-text-muted font-bold">No matching GS divisions</p>
                            <p className="text-[10px] text-text-muted/60 mt-1">
                                You can continue typing manually
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
