import React from 'react';

interface RichContentInstructionsModalProps {
    onClose: () => void;
}

const RichContentInstructionsModal: React.FC<RichContentInstructionsModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-text-primary">About Rich Content (RPD)</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="flex-1 p-6 overflow-y-auto space-y-6 text-text-secondary">
                    <div>
                        <h3 className="font-semibold text-lg text-text-primary mb-2">What is a Rich Product Description (RPD)?</h3>
                        <p>An RPD allows you to go beyond plain text descriptions. You can create a beautiful, magazine-style layout with images, feature lists, and banners to tell a story about your product, highlight its features, or explain its craftsmanship. It's a powerful way to engage customers and boost sales.</p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-text-primary mb-2">How to Use This Section</h3>
                        <ol className="list-decimal list-inside space-y-3">
                            <li>
                                <strong>Create your Layout:</strong> Click the "+ Create New" button. Give your RPD a title, then use the "+ Add Section" button to add pre-designed blocks. You can drag and drop sections to reorder them.
                                <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm">
                                    <li><strong>Image & Text Block:</strong> A side-by-side layout for a large image and descriptive text.</li>
                                    <li><strong>Three-Column Features:</strong> Highlight key benefits with icons and short descriptions.</li>
                                    <li><strong>Full-Width Banner:</strong> Create a striking visual with a large background image and overlay text.</li>
                                </ul>
                            </li>
                            <li><strong>Link to Products:</strong> In the RPD editor, use the "Product Selector" on the right to link this rich content to one or more products. An RPD can be linked to multiple products.</li>
                            <li><strong>Save:</strong> Once you're done, click "Save". Your RPD is now ready.</li>
                            <li><strong>Preview:</strong> Go to the "Products" page and switch to "Card View". Products with a linked RPD will show a special icon. Click it to see a preview of how the rich content will look to your customers.</li>
                        </ol>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg text-text-primary mb-2">Image Guidelines</h3>
                        <p>For the best results, we recommend the following for your images:</p>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                            <li><strong>Resolution:</strong> Use high-quality images, at least <strong className="text-text-primary">1200px</strong> wide.</li>
                            <li><strong>Aspect Ratio:</strong> While any size works, images with a consistent aspect ratio (e.g., 4:3 for landscape or 3:4 for portrait) create a more professional and clean look.</li>
                            <li><strong>File Size:</strong> Keep file sizes optimized for the web (ideally under 500KB) to ensure fast loading times for your customers.</li>
                        </ul>
                    </div>
                </main>
                 <footer className="flex items-center justify-end p-4 border-t border-gray-200 bg-gray-50">
                    <button onClick={onClose} className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">
                        Got it!
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default RichContentInstructionsModal;