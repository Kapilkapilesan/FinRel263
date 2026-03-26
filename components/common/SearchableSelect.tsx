import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface Option {
    id: string | number;
    label: string;
    subLabel?: string | null;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number | undefined;
    onChange: (value: string | number | undefined) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    label?: string;
    disabled?: boolean;
    isLoading?: boolean;
    error?: string;
    className?: string;
    onSearch?: (query: string) => void;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select option',
    searchPlaceholder = 'Search...',
    label,
    disabled = false,
    isLoading = false,
    error,
    className = '',
    onSearch
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.id?.toString() === value?.toString());

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            inputRef.current?.focus();
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
            setSearchQuery('');
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    const handleSelect = (option: Option) => {
        onChange(option.id);
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(undefined);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1 px-1">
                    {label}
                </label>
            )}

            <div
                onClick={handleToggle}
                className={`
                    flex items-center justify-between w-full px-4 py-1.5 bg-muted-bg/30 border rounded-2xl transition-all cursor-pointer group
                    ${isOpen ? 'border-primary-500/50 ring-4 ring-primary-500/10' : 'border-border-divider hover:border-border-default/80'}
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-muted-bg/10' : ''}
                    ${error ? 'border-rose-500/50 bg-rose-500/5' : ''}
                `}
            >
                <div className="flex-1 truncate mr-2">
                    {selectedOption ? (
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-text-primary uppercase tracking-tight truncate">
                                {selectedOption.label}
                            </span>
                            {selectedOption.subLabel && (
                                <span className="text-[10px] font-bold text-text-muted/60 uppercase truncate">
                                    {selectedOption.subLabel}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-sm font-bold text-text-muted/40 uppercase tracking-widest">{placeholder}</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {selectedOption && !disabled && (
                        <button
                            onClick={handleClear}
                            className="p-1 hover:bg-muted-bg rounded-lg text-text-muted/40 hover:text-rose-500 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary-500' : 'text-text-muted/40'}`} />
                </div>
            </div>

            {error && (
                <p className="mt-2 px-1 text-[10px] font-black text-rose-500 uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full bg-card border-2 border-border-default rounded-[1.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-border-divider/30 bg-muted-bg/10">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    onSearch?.(e.target.value);
                                }}
                                placeholder={searchPlaceholder}
                                className="w-full pl-11 pr-4 py-2 bg-muted-bg/30 border-border-divider/50 rounded-xl outline-none text-sm font-bold text-text-primary placeholder:text-text-muted/30 focus:bg-muted-bg/50 transition-all uppercase"
                            />
                        </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar grayscale-[0.5] hover:grayscale-0 transition-all">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="inline-block w-6 h-6 border-2 border-primary-500/10 border-t-primary-500 rounded-full animate-spin" />
                                <p className="mt-2 text-[10px] font-black text-text-muted uppercase tracking-widest">Loading options...</p>
                            </div>
                        ) : filteredOptions.length > 0 ? (
                            <div className="p-2 space-y-1">
                                {filteredOptions.map((option) => (
                                    <div
                                        key={option.id}
                                        onClick={() => handleSelect(option)}
                                        className={`
                                            flex items-center justify-between px-4 py-2 rounded-xl cursor-pointer transition-all border border-transparent
                                            ${value?.toString() === option.id?.toString()
                                                ? 'bg-primary-500/10 border-primary-500/20'
                                                : 'hover:bg-muted-bg/50 hover:border-border-divider/30'}
                                        `}
                                    >
                                        <div className="flex flex-col">
                                            <span className={`text-[13px] font-black uppercase tracking-tight ${value?.toString() === option.id.toString() ? 'text-primary-600' : 'text-text-primary'}`}>
                                                {option.label}
                                            </span>
                                            {option.subLabel && (
                                                <span className="text-[10px] font-bold text-text-muted/60 uppercase">
                                                    {option.subLabel}
                                                </span>
                                            )}
                                        </div>
                                        {value?.toString() === option.id?.toString() && (
                                            <Check className="w-4 h-4 text-primary-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-text-muted/40">
                                <Search className="w-8 h-8 mx-auto mb-2 opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No matching options found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
