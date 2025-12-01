
import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectChipInputProps {
    label: string;
    placeholder: string;
    availableOptions: { id: number; name: string }[];
    selectedItems: string[];
    onSelectedItemsChange: (items: string[]) => void;
}

const MultiSelectChipInput: React.FC<MultiSelectChipInputProps> = ({ label, placeholder, availableOptions, selectedItems, onSelectedItemsChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const availableToSelect = availableOptions.filter(opt => !selectedItems.includes(opt.name));

    const handleSelect = (itemName: string) => {
        if (!selectedItems.includes(itemName)) {
            onSelectedItemsChange([...selectedItems, itemName]);
        }
        setIsOpen(false);
    };

    const handleRemove = (itemToRemove: string) => {
        onSelectedItemsChange(selectedItems.filter(item => item !== itemToRemove));
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div ref={containerRef}>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="relative mt-1">
                <div 
                    onClick={() => setIsOpen(!isOpen)} 
                    className="flex flex-wrap items-center gap-2 p-2 min-h-[42px] border border-gray-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary cursor-pointer"
                >
                    {selectedItems.length > 0 ? (
                        selectedItems.map(item => (
                            <div key={item} className="flex items-center bg-primary text-white text-sm font-medium pl-3 pr-2 py-1 rounded-full">
                                <span>{item}</span>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleRemove(item); }} className="ml-2 text-white font-bold text-lg leading-none hover:text-gray-200">
                                    &times;
                                </button>
                            </div>
                        ))
                    ) : (
                        <span className="text-gray-400 pl-1">{placeholder}</span>
                    )}
                </div>
                {isOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        {availableToSelect.length > 0 ? (
                            <ul>
                                {availableToSelect.map(option => (
                                    <li key={option.id} onClick={() => handleSelect(option.name)} className="text-gray-900 cursor-pointer select-none relative py-2 px-4 hover:bg-gray-100">
                                        {option.name}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="py-2 px-4 text-sm text-gray-500">All options selected.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MultiSelectChipInput;
