import React, { useState } from "react";
import { Order, OrderStatus } from "../types";
import Pagination from "./Pagination";
import { formatCurrency } from "../constants";

const getStatusBadgeClass = (status: string): string => {
  const s = (status || "").toString().toLowerCase();
  switch (s) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
    case "canceled":
      return "bg-red-100 text-red-800";
    case "accepted":
      return "bg-blue-100 text-blue-800";
    case "dispatched":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const OrderActions: React.FC<{
  order: Order;
  onAccept: (orderId: number) => void;
  onReject: (orderId: number) => void;
  onDownloadInvoice: (order: Order) => void;
}> = ({ order, onAccept, onReject, onDownloadInvoice }) => {
  console.log("⚡ Rendering Actions for:", order.id, order.status); // REMOVE LATER

  switch ((order.status || "").toString().toLowerCase()) {
    case "pending":
      return (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => onAccept(order.id)}
            className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full hover:bg-green-200 transition"
          >
            Accept
          </button>
          <button
            onClick={() => onReject(order.id)}
            className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full hover:bg-red-200 transition"
          >
            Reject
          </button>
        </div>
      );
    case "accepted":
      return (
        <button
          onClick={() => onDownloadInvoice(order)}
          className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full hover:bg-blue-200 transition"
        >
          Generate Invoice
        </button>
      );
    case "dispatched":
    case "completed":
      return (
        <button
          onClick={() => onDownloadInvoice(order)}
          className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full hover:bg-blue-200 transition"
        >
          Download Invoice
        </button>
      );
    case "cancelled":
    case "canceled":
      return <span className="text-xs text-gray-400">-</span>;
    default:
      return null;
  }
};

const OrdersTable: React.FC<{
  orders: Order[];
  onAccept: (orderId: number) => void;
  onReject: (orderId: number) => void;
  onDownloadInvoice: (order: Order) => void;
  onChangeStatus: (orderId: number, status: OrderStatus) => Promise<void> | void;
  onEdit: (order: Order) => void;
  selectedOrderIds: Set<number>;
  onSelectOrder: (orderId: number) => void;
  onToggleSelectPage: (pageOrderIds: number[], select: boolean) => void;
  sortConfig: { key: "date"; direction: "asc" | "desc" };
  onSort: (key: "date") => void;
  loading?: boolean;
}> = ({
  orders,
  onAccept,
  onReject,
  onDownloadInvoice,
  onChangeStatus,
  onEdit,
  selectedOrderIds,
  onSelectOrder,
  onToggleSelectPage,
  sortConfig,
  onSort,
  loading = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  // DEBUG pagination
  console.log("📄 Current Page Orders:", currentOrders); // REMOVE LATER

  if (currentOrders.length === 0 && orders.length > 0) {
    setCurrentPage(1);
  }

  const SortIcon: React.FC<{ direction: "asc" | "desc" }> = ({ direction }) => {
    const iconClass = "h-4 w-4";
    if (direction === "asc") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      );
    }
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={iconClass}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  return (
    <div className="bg-card rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-50 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Order ID</th>
              <th className="py-3 px-6 text-left">Customer</th>
              <th className="py-3 px-6 text-left">Product Name</th>
              <th className="py-3 px-6 text-center">
                <button
                  onClick={() => onSort("date")}
                  className="flex items-center justify-center w-full group"
                >
                  <span className="group-hover:text-primary">Date</span>
                  <span className="ml-2 text-gray-400 group-hover:text-primary">
                    <SortIcon direction={sortConfig.direction} />
                  </span>
                </button>
              </th>
              <th className="py-3 px-6 text-right">Amount</th>
              <th className="py-3 px-6 text-center">Status</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {loading && (
              <tr>
                <td colSpan={7} className="py-10">
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Loading orders...</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && currentOrders.map((order) => (
              <tr
                key={order.id}
                className={`border-b border-gray-200 hover:bg-gray-50 ${
                  selectedOrderIds.has(order.id) ? "bg-blue-50" : ""
                }`}
              >
                <td className="py-3 px-6 text-left font-medium text-primary">
                  #{order.id}
                </td>
                <td className="py-3 px-6 text-left">{order.customerName}</td>
                <td className="py-3 px-6 text-left align-top">
                  {(order.items ?? []).length === 0 ? (
                    <span className="text-gray-400 text-sm">No products</span>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      {(order.items ?? []).map((item) => (
                        <li key={item.id} className="text-sm font-medium leading-relaxed" title={item.name}>
                          {item.name || "Product"}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-3 px-6 text-center">
                  {order.date
                    ? new Date(order.date).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="py-3 px-6 text-right font-medium">
                  {formatCurrency(order.amount || 0)}
                </td>
                <td className="py-3 px-6 text-center">
                  <div className="flex md:flex-row flex-col items-center justify-center gap-2 min-w-[220px]">
                    <span
                      className={`py-1 px-3 rounded-full text-xs ${getStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <select
                      value={(order.status || "").toString()}
                      onChange={(e) =>
                        onChangeStatus(order.id, e.target.value as OrderStatus)
                      }
                      className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {Object.values(OrderStatus).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="py-3 px-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <OrderActions
                      order={order}
                      onAccept={onAccept}
                      onReject={onReject}
                      onDownloadInvoice={onDownloadInvoice}
                    />
                    <button
                      onClick={() => onEdit(order)}
                      className="text-xs underline text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && currentOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-500">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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

export default OrdersTable;
