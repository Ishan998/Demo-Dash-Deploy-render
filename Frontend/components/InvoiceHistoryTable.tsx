// import React, { useState, useMemo } from "react";
// import { Order } from "../types";
// import Pagination from "./Pagination";
// import { ICONS, formatCurrency } from "../constants";

// interface InvoiceHistoryTableProps {
//   invoices: Order[];
//   onDownloadInvoice: (order: Order) => void;
// }

// const InvoiceHistoryTable: React.FC<InvoiceHistoryTableProps> = ({
//   invoices,
//   onDownloadInvoice,
// }) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   const filteredInvoices = useMemo(() => {
//     if (!searchTerm) return invoices;
//     const lower = searchTerm.toLowerCase();
//     return invoices.filter(
//       (invoice) =>
//         (invoice.customer?.name || "").toLowerCase().includes(lower) ||
//         String(invoice.id).includes(lower) ||
//         (invoice.items ?? []).some(
//           (item) =>
//             (item.name || "").toLowerCase().includes(lower) ||
//             String(item.id || "").toLowerCase().includes(lower)
//         )
//     );
//   }, [invoices, searchTerm]);

//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = filteredInvoices.slice(
//     indexOfFirstItem,
//     indexOfLastItem
//   );
//   const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

//   return (
//     <div className="bg-card rounded-xl shadow-md overflow-hidden">
//       {/* 🔍 Search */}
//       <div className="p-4 border-b">
//         <div className="relative w-full max-w-md">
//           <input
//             type="text"
//             placeholder="Search by customer, Order ID, or SKU..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10 pr-4 py-2 w-full rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
//           />
//           <svg
//             className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//             />
//           </svg>
//         </div>
//       </div>

//       {/* 📊 Table */}
//       <div className="overflow-x-auto">
//         <table className="min-w-full table-auto">
//           <thead>
//             <tr className="bg-gray-50 text-gray-600 uppercase text-sm leading-normal">
//               <th className="py-3 px-6 text-left">Invoice ID</th>
//               <th className="py-3 px-6 text-left">Customer</th>
//               <th className="py-3 px-6 text-left">Products (SKU)</th>
//               <th className="py-3 px-6 text-center">Date Created</th>
//               <th className="py-3 px-6 text-right">Amount</th>
//               <th className="py-3 px-6 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="text-gray-600 text-sm font-light">
//             {currentItems.map((invoice) => (
//               <tr
//                 key={invoice.id}
//                 className="border-b border-gray-200 hover:bg-gray-50"
//               >
//                 <td className="py-3 px-6 text-left font-medium text-primary">
//                   #{invoice.id}
//                 </td>
//                 <td className="py-3 px-6 text-left">
//                   {invoice.customer?.name || "N/A"}
//                 </td>
//                 <td className="py-3 px-6 text-left">
//                   <ul className="list-disc list-inside">
//                     {(invoice.items ?? []).map((item, idx) => (
//                       <li
//                         key={idx}
//                         className="text-xs truncate"
//                         title={item.name}
//                       >
//                         {item.name || "Unnamed"} ({item.id || "SKU"})
//                       </li>
//                     ))}
//                   </ul>
//                 </td>
//                 <td className="py-3 px-6 text-center">
//                   {invoice.created_at
//                     ? new Date(invoice.created_at).toLocaleString()
//                     : "N/A"}
//                 </td>
//                 <td className="py-3 px-6 text-right font-medium">
//                   {formatCurrency(invoice.total_amount || 0)}
//                 </td>
//                 <td className="py-3 px-6 text-center">
//                   {["Dispatched", "Completed"].includes(invoice.status) ? (
//                     <button
//                       onClick={() => onDownloadInvoice(invoice)}
//                       className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full hover:bg-blue-200 transition flex items-center mx-auto"
//                     >
//                       {ICONS.download &&
//                         React.cloneElement(ICONS.download, {
//                           className: "h-4 w-4",
//                         })}
//                       <span className="ml-1">Download</span>
//                     </button>
//                   ) : (
//                     <span className="text-gray-400 text-xs">Not Ready</span>
//                   )}
//                 </td>
//               </tr>
//             ))}
//             {currentItems.length === 0 && (
//               <tr>
//                 <td colSpan={6} className="text-center py-8 text-gray-500">
//                   No invoices found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* 📑 Pagination */}
//       {totalPages > 1 && (
//         <Pagination
//           currentPage={currentPage}
//           totalPages={totalPages}
//           onPageChange={setCurrentPage}
//         />
//       )}
//     </div>
//   );
// };

// export default InvoiceHistoryTable;
import React, { useState, useMemo } from "react";
import { Order } from "../types";
import Pagination from "./Pagination";
import { ICONS, formatCurrency } from "../constants";

interface InvoiceHistoryTableProps {
  invoices: Order[];
  onDownloadInvoice: (order: Order) => void;
  loading?: boolean;
}

const InvoiceHistoryTable: React.FC<InvoiceHistoryTableProps> = ({
  invoices,
  onDownloadInvoice,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const lower = searchTerm.toLowerCase();
    return invoices.filter(
      (invoice) =>
        (invoice.customerName || "").toLowerCase().includes(lower) ||
        String(invoice.id).includes(lower) ||
        (invoice.items ?? []).some(
          (item) =>
            (item.name || "").toLowerCase().includes(lower) ||
            String(item.id || "").toLowerCase().includes(lower)
        )
    );
  }, [invoices, searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInvoices.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  return (
    <div className="bg-card rounded-xl shadow-md overflow-hidden">
      {/* 🔍 Search */}
      <div className="p-4 border-b">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by customer, Order ID, or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* 📊 Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-50 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Invoice ID</th>
              <th className="py-3 px-6 text-left">Customer</th>
              <th className="py-3 px-6 text-left">Products (SKU)</th>
              <th className="py-3 px-6 text-center">Date Created</th>
              <th className="py-3 px-6 text-right">Amount</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {loading && (
              <tr>
                <td colSpan={6} className="py-10">
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Loading invoices...</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && currentItems.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="py-3 px-6 text-left font-medium text-primary">
                  #{invoice.id}
                </td>
                <td className="py-3 px-6 text-left">
                  {invoice.customerName || "N/A"}
                </td>
                <td className="py-3 px-6 text-left">
                  <ul className="list-disc list-inside">
                    {(invoice.items ?? []).map((item, idx) => (
                      <li
                        key={idx}
                        className="text-xs truncate"
                        title={item.name}
                      >
                        {item.name || "Unnamed"} {item.sku ? `(${item.sku})` : ""}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="py-3 px-6 text-center">
                  {invoice.date
                    ? new Date(invoice.date).toLocaleString()
                    : "N/A"}
                </td>
                <td className="py-3 px-6 text-right font-medium">
                  {formatCurrency(invoice.amount || 0)}
                </td>
                <td className="py-3 px-6 text-center">
                  {["dispatched", "completed", "Dispatched", "Completed"].includes(
                    invoice.status
                  ) ? (
                    <button
                      onClick={() => onDownloadInvoice(invoice)}
                      className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full hover:bg-blue-200 transition flex items-center mx-auto"
                    >
                      {ICONS.download &&
                        React.cloneElement(ICONS.download, {
                          className: "h-4 w-4",
                        })}
                      <span className="ml-1">Download</span>
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs">Not Ready</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && currentItems.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 📑 Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default InvoiceHistoryTable;
