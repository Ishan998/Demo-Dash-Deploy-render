
import { Product, ProductStatus } from '../types';
import { read, utils, writeFile } from 'xlsx';

// Single-product template (no variants)
export const CSV_HEADERS = [
    'Handle', 
    'Name',
    'Description',
    'MainCategory',
    'SubCategory',
    'Materials',
    'GST',
    'Specifications',
    'CrystalName',
    'Colors', 
    'Occasions', 
    'Tags', 
    'IsReturnable',
    'DeliveryWeight(kg)',
    'DeliveryWidth(cm)',
    'DeliveryHeight(cm)',
    'DeliveryDepth(cm)',
    'DeliveryInDays',
    'DeliveryCharges',
    'ReturnCharges',
    'SKU', 
    'MRP',
    'SellingPrice',
    'Stock',
];

// Sample rows to include in templates (Artificial Jewellery domain)
const SAMPLE_ROW_1: Record<string, string> = {
    'Handle': 'crystal-pendant-necklace',
    'Name': 'Crystal Pendant Necklace',
    'Description': 'Elegant crystal pendant on gold-tone chain',
    'MainCategory': 'Jewellery',
    'SubCategory': 'Necklaces',
    'Materials': 'Alloy,Crystal',
    'GST': '3',
    'Specifications': 'Chain length 45cm',
    'CrystalName': 'Austrian Crystal',
    'Colors': 'Gold',
    'Occasions': 'Party,Casual',
    'Tags': 'Necklace,Crystal,Gold',
    'IsReturnable': 'TRUE',
    'DeliveryWeight(kg)': '0.1',
    'DeliveryWidth(cm)': '10',
    'DeliveryHeight(cm)': '2',
    'DeliveryDepth(cm)': '10',
    'DeliveryInDays': '5',
    'DeliveryCharges': '0',
    'ReturnCharges': '0',
    'SKU': 'NEC-CRY-001',
    'MRP': '1499',
    'SellingPrice': '1199',
    'Stock': '25',
};

const SAMPLE_ROW_2: Record<string, string> = {
    'Handle': 'pearl-stud-earrings',
    'Name': 'Pearl Stud Earrings',
    'Description': 'Classic faux pearl stud earrings',
    'MainCategory': 'Jewellery',
    'SubCategory': 'Earrings',
    'Materials': 'Alloy,Pearl',
    'GST': '3',
    'Specifications': '6mm studs',
    'CrystalName': '',
    'Colors': 'White,Silver',
    'Occasions': 'Office,Daily',
    'Tags': 'Earrings,Pearl',
    'IsReturnable': 'TRUE',
    'DeliveryWeight(kg)': '0.05',
    'DeliveryWidth(cm)': '5',
    'DeliveryHeight(cm)': '2',
    'DeliveryDepth(cm)': '5',
    'DeliveryInDays': '5',
    'DeliveryCharges': '0',
    'ReturnCharges': '0',
    'SKU': 'EAR-PRL-002',
    'MRP': '799',
    'SellingPrice': '599',
    'Stock': '40',
};

const SAMPLE_HANDLES = new Set(['crystal-pendant-necklace', 'pearl-stud-earrings']);

const orderedValues = (row: Record<string, string>): (string | number)[] => CSV_HEADERS.map(h => row[h] ?? '');

const csvEscape = (v: string | number): string => {
    const s = String(v ?? '');
    if (s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    if (s.includes(',') || s.includes('\n') || s.includes('\r')) {
        return '"' + s + '"';
    }
    return s;
}

const toCsvLine = (vals: (string | number)[]) => vals.map(csvEscape).join(',');

export const downloadCsvTemplate = () => {
    const rows = [
        toCsvLine(CSV_HEADERS),
        toCsvLine(orderedValues(SAMPLE_ROW_1)),
        toCsvLine(orderedValues(SAMPLE_ROW_2)),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "product_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Optional: Excel (.xlsx) template for convenience
export const downloadXlsxTemplate = () => {
    const wb = utils.book_new();
    const ws = utils.aoa_to_sheet([
        CSV_HEADERS,
        orderedValues(SAMPLE_ROW_1),
        orderedValues(SAMPLE_ROW_2),
    ]);
    utils.book_append_sheet(wb, ws, 'Template');
    writeFile(wb, 'product_upload_template.xlsx');
}

const parseCsv = (csvString: string): Record<string, string>[] => {
    const lines = csvString.trim().replace(/\r/g, '').split('\n');
    const headerLine = lines.shift();
    if (!headerLine) return [];

    const headers = headerLine.split(',').map(h => h.trim());

    return lines.map(line => {
        const values = [];
        let currentVal = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && (i === 0 || line[i-1] !== '\\')) { // handle escaped quotes later if needed
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentVal);
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        values.push(currentVal);

        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
            let value = (values[index] || '').trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            obj[header] = value.replace(/""/g, '"'); // handle double quotes
        });
        return obj;
    });
};

const validateHeaders = (data: Record<string, any>[]): string | null => {
    if (!data || data.length === 0) return "The uploaded file is empty or missing headers.";
    const keysUnion = new Set<string>();
    for (const row of data) {
        Object.keys(row || {}).forEach(k => keysUnion.add(k));
    }
    const present = Array.from(keysUnion);
    const missingEssential: string[] = [];
    if (!present.includes('Handle')) missingEssential.push('Handle');
    if (!present.includes('Name')) missingEssential.push('Name');
    if (!present.includes('SKU')) missingEssential.push('SKU');
    if (missingEssential.length > 0) {
        const samples = missingEssential.map(h => {
            const sampleRow = SAMPLE_ROW_1 as Record<string, string>;
            return `${h} => e.g., ${sampleRow[h] || 'value'}`;
        }).join(' | ');
        return `Missing column(s): ${missingEssential.join(', ')}. Example: ${samples}`;
    }
    return null;
}

const detectSampleData = (data: Record<string, any>[]): string | null => {
    const found = new Set<string>();
    for (const row of data) {
        const handle = String(row['Handle'] || '').trim();
        if (SAMPLE_HANDLES.has(handle)) found.add(handle);
    }
    if (found.size > 0) {
        return `Please delete sample rows before uploading. Found sample handle(s): ${Array.from(found).join(', ')}`;
    }
    return null;
}

const validateRowValues = (data: Record<string, any>[]): string | null => {
    const numLike = (v: any) => v === '' || v === null || v === undefined ? true : !isNaN(parseFloat(String(v)));
    const seenHandles = new Set<string>();
    for (let i = 0; i < data.length; i++) {
        const row = data[i] || {};
        const rowNum = i + 2; // considering header row at 1
        const handle = (row['Handle'] ?? '').toString().trim();
        if (!handle) {
            return `Missing 'Handle' in row ${rowNum}. Example: Handle='${SAMPLE_ROW_1['Handle']}'`;
        }
        if (seenHandles.has(handle)) {
            return `Duplicate Handle '${handle}' detected in row ${rowNum}. Variants are not supported. Use one row per product with a unique Handle.`;
        }
        seenHandles.add(handle);

        const name = (row['Name'] ?? '').toString().trim();
        if (!name) {
            return `Missing 'Name' for product with handle '${handle}' in row ${rowNum}. Example: Name='${SAMPLE_ROW_1['Name']}'`;
        }
        const sku = (row['SKU'] ?? '').toString().trim();
        if (!sku) {
            return `Missing 'SKU' for product with handle '${handle}' in row ${rowNum}. Example: SKU='${SAMPLE_ROW_1['SKU']}'`;
        }
        // Numeric fields checks
        const numericFields = ['MRP', 'SellingPrice', 'Stock', 'GST', 'DeliveryWeight(kg)', 'DeliveryWidth(cm)', 'DeliveryHeight(cm)', 'DeliveryDepth(cm)', 'DeliveryInDays', 'DeliveryCharges', 'ReturnCharges'];
        for (const f of numericFields) {
            const v = row[f];
            if (v !== undefined && v !== null && String(v).trim() !== '' && !numLike(v)) {
                const sampleRow = SAMPLE_ROW_1 as Record<string, string>;
                return `Invalid value for '${f}' in row ${rowNum}. Example: ${f}='${sampleRow[f] || '10'}'`;
            }
        }
    }
    return null;
}

const transformDataToProducts = (data: Record<string, any>[]): { newProducts: Product[], error: string | null } => {
    if (data.length === 0) {
        return { newProducts: [], error: "The uploaded file is empty or missing headers." };
    }
    // Header presence
    const headerError = validateHeaders(data);
    if (headerError) return { newProducts: [], error: headerError };
    // Detect if user left sample rows unchanged
    const sampleError = detectSampleData(data);
    if (sampleError) return { newProducts: [], error: sampleError };
    // Validate row values and show examples in error
    const valuesError = validateRowValues(data);
    if (valuesError) return { newProducts: [], error: valuesError };
    const productsMap = new Map<string, Product>();

    for (const [i, row] of data.entries()) {
        const handle = row['Handle'];
        if (!handle) {
            return { newProducts: [], error: `Missing 'Handle' in row ${i + 2}. Example: Handle='${SAMPLE_ROW_1['Handle']}'` };
        }

        if (productsMap.has(handle)) {
            return { newProducts: [], error: `Duplicate Handle '${handle}' found (row ${i + 2}). Variants are not supported; use one row per product.` };
        }

        if (!row['Name']) {
            return { newProducts: [], error: `Missing 'Name' for product with handle '${handle}' in row ${i + 2}. Example: Name='${SAMPLE_ROW_1['Name']}'` };
        }
        if (!row['SKU']) {
            return { newProducts: [], error: `Missing 'SKU' for product with handle '${handle}' in row ${i + 2}. Example: SKU='${SAMPLE_ROW_1['SKU']}'` };
        }

        const newProduct: Product = {
                // Fix: Changed product ID from string to a unique number to match the 'Product' type.
                id: Date.now() + i,
                name: row['Name'],
                description: row['Description'] || '',
                mainCategory: row['MainCategory'] || 'Uncategorized',
                subCategory: row['SubCategory'] || '',
                materials: row['Materials'] ? String(row['Materials']).split(',').map(s => s.trim()) : [],
                sku: row['SKU'] || '',
                mrp: parseFloat(row['MRP']) || 0,
                sellingPrice: parseFloat(row['SellingPrice']) || 0,
                stock: parseInt(String(row['Stock']), 10) || 0,
                status: ProductStatus.InStock,
                gst: parseFloat(row['GST']) || 0,
                images: [],
                specifications: row['Specifications'] || '',
                crystalName: row['CrystalName'] || '',
                colors: row['Colors'] ? String(row['Colors']).split(',').map(s => s.trim()) : [],
                occasions: row['Occasions'] ? String(row['Occasions']).split(',').map(s => s.trim()) : [],
                isReturnable: String(row['IsReturnable'])?.toUpperCase() === 'TRUE',
                variants: [],
                deliveryInfo: {
                    weight: parseFloat(row['DeliveryWeight(kg)']) || 0,
                    width: parseFloat(row['DeliveryWidth(cm)']) || 0,
                    height: parseFloat(row['DeliveryHeight(cm)']) || 0,
                    depth: parseFloat(row['DeliveryDepth(cm)']) || 0,
                    deliveryCharges: parseFloat(row['DeliveryCharges']) || 0,
                    returnCharges: parseFloat(row['ReturnCharges']) || 0,
                    deliveryInDays: parseInt(String(row['DeliveryInDays']), 10) || 0,
                },
                tags: row['Tags'] ? String(row['Tags']).split(',').map(s => s.trim()) : [],
            };
        productsMap.set(handle, newProduct);
    }
    
    const newProducts: Product[] = [];
    for (const product of productsMap.values()) {
        const totalStock = product.stock; // no variants supported
        product.status = totalStock > 0 ? ProductStatus.InStock : ProductStatus.OutOfStock;
        
        newProducts.push(product);
    }

    if (newProducts.length === 0) {
        return { newProducts: [], error: "No valid product data found in the file." };
    }

    return { newProducts, error: null };
}

export const processFileUpload = async (file: File): Promise<{ newProducts: Product[], error: string | null }> => {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                let parsedData: Record<string, any>[];
                if (file.name.endsWith('.csv')) {
                    const text = e.target?.result as string;
                    parsedData = parseCsv(text);
                } else {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    if (!sheetName) {
                        resolve({ newProducts: [], error: "Could not find any sheets in the Excel file." });
                        return;
                    }
                    const worksheet = workbook.Sheets[sheetName];
                    parsedData = utils.sheet_to_json(worksheet, { raw: false });
                }

                const result = transformDataToProducts(parsedData);
                resolve(result);

            } catch (err) {
                console.error("Error processing file:", err);
                resolve({ newProducts: [], error: "An unexpected error occurred while processing the file." });
            }
        };

        reader.onerror = () => {
           resolve({ newProducts: [], error: "Error reading the file." });
        };

        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.readAsArrayBuffer(file);
        } else {
            resolve({ newProducts: [], error: 'Unsupported file type. Please upload a CSV or Excel file.' });
        }
    });
};
