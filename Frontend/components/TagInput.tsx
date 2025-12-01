import React, { useState, KeyboardEvent } from 'react';

interface TagInputProps {
    tags: string[];
    onTagsChange: (tags: string[]) => void;
    placeholder: string;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onTagsChange, placeholder }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ',' || e.key === 'Enter') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (newTag && !tags.includes(newTag)) {
                onTagsChange([...tags, newTag]);
            }
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
            {tags.map(tag => (
                <div key={tag} className="flex items-center bg-primary text-white text-sm font-medium pl-3 pr-2 py-1 rounded-full">
                    <span>{tag}</span>
                    <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-white font-bold text-lg leading-none hover:text-gray-200">
                        &times;
                    </button>
                </div>
            ))}
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? placeholder : ''}
                className="flex-grow p-1 border-none focus:ring-0 outline-none bg-transparent"
            />
        </div>
    );
};

export default TagInput;
