import React from 'react';

interface UploadInstructionsModalProps {
    onClose: () => void;
}

const UploadInstructionsModal: React.FC<UploadInstructionsModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                    <h2 className="text-xl font-bold text-text-primary">How to Upload Products with CSV or Excel</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <main className="flex-1 p-6 overflow-y-auto space-y-6 text-text-secondary">
                    <div>
                        <p>You can download the CSV/Excel template, fill it out using any spreadsheet software (like Excel, Google Sheets, or Numbers), and then save and upload it as either a CSV or an Excel file (.xlsx).</p>
                        <p className="mt-2 text-red-600 font-medium">Note: The template contains example rows (e.g., handles "crystal-pendant-necklace" and "pearl-stud-earrings"). Please delete these sample rows before uploading, otherwise the upload will be rejected.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-text-primary mb-2">Key Concept: One Row = One Product</h3>
                        <p>This uploader is designed for Artificial Jewellery single products only. <strong className="text-text-primary">Variants are not supported.</strong> Use a unique <code className="bg-gray-200 text-sm p-1 rounded">Handle</code> for each product and do not repeat it in multiple rows.</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-text-primary mb-2">Example 1: Simple Product (No Variants)</h3>
                        <p className="mb-2">For each product, add a single row containing at least <code className="bg-gray-200 text-sm p-1 rounded">Handle</code>, <code className="bg-gray-200 text-sm p-1 rounded">Name</code>, and <code className="bg-gray-200 text-sm p-1 rounded">SKU</code>, plus pricing and stock as applicable.</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2">Handle</th>
                                        <th className="p-2">Name</th>
                                        <th className="p-2">SKU</th>
                                        <th className="p-2">SellingPrice</th>
                                        <th className="p-2">Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="p-2 font-mono">crystal-pendant-necklace</td>
                                        <td className="p-2">Crystal Pendant Necklace</td>
                                        <td className="p-2">NEC-CRY-001</td>
                                        <td className="p-2">1199</td>
                                        <td className="p-2">25</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-text-primary mb-2">Important</h3>
                        <p className="mb-2">Variants are not supported in this uploader. Do not repeat the same <code className="bg-gray-200 text-sm p-1 rounded">Handle</code> in multiple rows. Each row represents one product.</p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-text-primary mb-2">Putting It All Together: Uploading Multiple Products</h3>
                        <p className="mb-2">To upload multiple products at once, add one row per product. Do not repeat Handles; duplicates will be rejected.</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2">Handle</th>
                                        <th className="p-2">Name</th>
                                        <th className="p-2">SKU</th>
                                        <th className="p-2">...other columns</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="p-2 font-mono bg-green-100">cotton-tshirt</td>
                                        <td className="p-2">Crystal Pendant Necklace</td>
                                        <td className="p-2">NEC-CRY-001</td>
                                        <td className="p-2">...</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-2 font-mono bg-green-100">cotton-tshirt</td>
                                        <td className="p-2">Pearl Stud Earrings</td>
                                        <td className="p-2">EAR-PRL-002</td>
                                        <td className="p-2">...</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-2 font-mono bg-blue-100">leather-bag</td>
                                        <td className="p-2">Leather Messenger Bag</td>
                                        <td className="p-2"><em>(blank)</em></td>
                                        <td className="p-2">...</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-2 font-mono bg-green-100">organic-coffee</td>
                                        <td className="p-2">Organic Coffee Beans</td>
                                        <td className="p-2">250g</td>
                                        <td className="p-2">...</td>
                                    </tr>
                                     <tr className="border-b">
                                        <td className="p-2 font-mono bg-green-100">organic-coffee</td>
                                        <td className="p-2"><em>(blank)</em></td>
                                        <td className="p-2">500g</td>
                                        <td className="p-2">...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg text-text-primary mb-2">Column Guidelines</h3>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Required Fields:</strong> <code className="bg-gray-200 text-sm p-1 rounded">Handle</code> is always required. <code className="bg-gray-200 text-sm p-1 rounded">Name</code> is required for the first row of a new product.</li>
                            <li><strong>Multi-value Fields:</strong> For columns like <code className="bg-gray-200 text-sm p-1 rounded">Colors</code>, <code className="bg-gray-200 text-sm p-1 rounded">Occasions</code>, and <code className="bg-gray-200 text-sm p-1 rounded">Tags</code>, enter multiple values separated by a comma (e.g., <code className="bg-gray-200 text-sm p-1 rounded">Red, Green, Blue</code>).</li>
                            <li><strong>Boolean Fields:</strong> For <code className="bg-gray-200 text-sm p-1 rounded">IsReturnable</code>, use <code className="bg-gray-200 text-sm p-1 rounded">TRUE</code> or <code className="bg-gray-200 text-sm p-1 rounded">FALSE</code>.</li>
                             <li><strong>Numeric Fields:</strong> Columns like <code className="bg-gray-200 text-sm p-1 rounded">MRP</code>, <code className="bg-gray-200 text-sm p-1 rounded">SellingPrice</code>, <code className="bg-gray-200 text-sm p-1 rounded">Stock</code>, and <code className="bg-gray-200 text-sm p-1 rounded">GST</code> should only contain numbers.</li>
                        </ul>
                    </div>
                </main>

                <footer className="flex items-center justify-end p-4 border-t border-gray-200 space-x-4 bg-gray-50 flex-shrink-0">
                    <button onClick={onClose} className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">
                        Got it!
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default UploadInstructionsModal;
