import React, { useState, useMemo, useEffect, useRef } from "react";
import { ICONS, formatCurrency } from "../constants";
import { Order, OrderStatus, Product, ProductItem, Log, NotificationType } from "../types";
import OrdersTable from "../components/OrdersTable";
import { utils, writeFile } from "xlsx";
import Toast from "../components/Toast";
import * as api from "../services/apiService";
import { createNotification } from "../services/apiService";
import OrderFormModal from "../components/OrderFormModal";
import InvoiceHistoryTable from "../components/InvoiceHistoryTable";
import { InitialPageProps } from "../App";
import InvoiceTemplate from "../components/InvoiceTemplate";


interface OrdersPageProps {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  allProducts: Product[];
  addLog: (message: string, type?: Log["type"]) => void;
  initialProps: (InitialPageProps & { onApplied: () => void }) | null;
}

const OrdersPage: React.FC<OrdersPageProps> = ({
  orders,
  setOrders,
  allProducts,
  addLog,
  initialProps,
}) => {
  // ✅ SAFEGUARD against invalid type (null/object/undefined)
  // const safeOrders: Order[] = Array.isArray(orders) ? orders : [];
  // Map backend order -> frontend-friendly order
  const normalizeStatus = (s: any): OrderStatus => {
    const lower = String(s || "").toLowerCase();
    switch (lower) {
      case "pending":
        return OrderStatus.Pending;
      case "accepted":
        return OrderStatus.Accepted;
      case "dispatched":
        return OrderStatus.Dispatched;
      case "completed":
        return OrderStatus.Completed;
      case "cancelled":
      case "canceled":
        return OrderStatus.Cancelled;
      default:
        return (s as OrderStatus) || OrderStatus.Pending;
    }
  };

  const normalizeOrder = (order: any): Order => ({
    id: order.id,
    customerName: order.customer?.name || order.customer_name || order.customerName || "N/A",
    customerEmail: order.customer?.email || order.customerEmail || undefined,
    customerPhone: order.customer?.phone || order.customerPhone || undefined,
    date: order.created_at || order.date || order.createdAt,
    status: normalizeStatus(order.status),
    amount: Number(order.total_amount ?? order.amount ?? order.totalAmount ?? 0),
    paymentMethod: order.payment_method || order.paymentMethod,
    gstPercent: order.gst_percent ?? order.gstPercent ?? undefined,
    deliveryCharge: order.delivery_charge ?? order.deliveryCharge ?? undefined,
    items: (order.items || []).map((it: any) => ({
      id: it.id?.toString?.() ?? it.id ?? `${it.name}-${Math.random()}`,
      name: it.name,
      sku: it.sku,
      price: Number(it.price ?? 0),
      quantity: Number(it.quantity ?? 0),
    })),
    address: (order.address_line1 || order.city || order.state || order.pincode)
      ? {
          line1: order.address_line1 || "",
          line2: order.address_line2 || "",
          city: order.city || "",
          state: order.state || "",
          pincode: order.pincode || "",
        }
      : undefined,
  });
  const safeOrders: Order[] = Array.isArray(orders)
    ? orders.map(normalizeOrder)
    : [];

  const [view, setView] = useState<"orders" | "invoices">("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    OrderStatus | "All" | "In Progress"
  >("All");
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(
    new Set()
  );
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: "date";
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const prevOrderIdsRef = useRef<Set<number>>(new Set());
  const firstLoadRef = useRef<boolean>(true);

  useEffect(() => {
    if (initialProps) {
      if (initialProps.searchTerm) setSearchTerm(initialProps.searchTerm);
      if (initialProps.statusFilter)
        setStatusFilter(initialProps.statusFilter as any);
      initialProps.onApplied();
    }
  }, [initialProps]);

  // Notify when new orders are received while on Orders page
  useEffect(() => {
    const currIds = new Set(safeOrders.map(o => o.id));
    if (firstLoadRef.current) {
      prevOrderIdsRef.current = currIds;
      firstLoadRef.current = false;
      return;
    }
    const prevIds = prevOrderIdsRef.current;
    const newlyAdded = [...currIds].filter(id => !prevIds.has(id));
    if (newlyAdded.length > 0) {
      newlyAdded.forEach(id => {
        const ord = safeOrders.find(o => o.id === id);
        if (ord) {
          // Fire in-app notification and a local toast
          createNotification({
            title: "New Order Received",
            message: `#${ord.id} from ${ord.customerName || 'Customer'}`,
            type: NotificationType.NewOrder,
          }).catch(() => {});
        }
      });
      const first = safeOrders.find(o => o.id === newlyAdded[0]);
      if (first) setToast({ message: `New order received: #${first.id}`, type: "success" });
      // Allow header to refresh notifications list
      try { sessionStorage.setItem('refreshNotifications', '1'); } catch {}
    }
    prevOrderIdsRef.current = currIds;
  }, [orders]);

  const sortedOrders = useMemo(() => {
    const filtered = safeOrders.filter((order) => {
      if (view !== "orders") return true;
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const matchesSearch =
        (order.customerName?.toLowerCase().includes(lowerCaseSearchTerm) ??
          false) ||
        String(order.id).toLowerCase().includes(lowerCaseSearchTerm);

      if (!matchesSearch) return false;

      if (statusFilter === "All") return true;
      if (statusFilter === "In Progress") {
        return (
          order.status === OrderStatus.Pending ||
          order.status === OrderStatus.Accepted
        );
      }
      if (statusFilter === "Pending") {
        return order.status === OrderStatus.Pending;
      }
      return order.status === statusFilter;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA < dateB) return sortConfig.direction === "asc" ? -1 : 1;
      if (dateA > dateB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [safeOrders, searchTerm, statusFilter, sortConfig, view]);

  // const invoiceHistory = useMemo(() => {
  //     return safeOrders.filter(order =>
  //         order.status === OrderStatus.Dispatched || order.status === OrderStatus.Completed
  //     );
  // }, [safeOrders]);
  const invoiceHistory = useMemo(() => {
    return safeOrders.filter(
      (order) =>
        order.status === OrderStatus.Dispatched ||
        order.status === OrderStatus.Completed
    );
  }, [safeOrders]);

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrderIds((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(orderId)) newSelection.delete(orderId);
      else newSelection.add(orderId);
      return newSelection;
    });
  };

  const handleToggleSelectPage = (pageOrderIds: number[], select: boolean) => {
    setSelectedOrderIds((prev) => {
      const newSelection = new Set(prev);
      pageOrderIds.forEach((id) =>
        select ? newSelection.add(id) : newSelection.delete(id)
      );
      return newSelection;
    });
  };

  const updateOrderInState = (updatedOrder: Order) => {
    // normalize and update (preserve existing items if backend omits them)
    const normalized = normalizeOrder(updatedOrder as any);
    setOrders(
      safeOrders.map((o) => {
        if (o.id !== normalized.id) return o;
        const items = (normalized.items && normalized.items.length > 0) ? normalized.items : o.items;
        return { ...normalized, items };
      })
    );
  };

  const handleAcceptOrder = async (orderId: number) => {
    try {
      setIsWorking(true);
      const updatedOrder = await api.updateOrderStatus(
        orderId,
        OrderStatus.Accepted
      );
      updateOrderInState(updatedOrder);
      addLog(`Order #${orderId} accepted.`);
      setToast({ message: `Order #${orderId} accepted.`, type: "success" });
    } catch {
      setToast({
        message: `Failed to accept Order #${orderId}.`,
        type: "error",
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleRejectOrder = async (orderId: number) => {
    try {
      setIsWorking(true);
      const updatedOrder = await api.updateOrderStatus(
        orderId,
        OrderStatus.Cancelled
      );
      updateOrderInState(updatedOrder);
      addLog(`Order #${orderId} cancelled.`, "warning");
      setToast({ message: `Order #${orderId} cancelled.`, type: "success" });
    } catch {
      setToast({
        message: `Failed to cancel Order #${orderId}.`,
        type: "error",
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleRefreshOrders = async () => {
    try {
      setIsWorking(true);
      const latest = await api.getOrders();
      setOrders(latest);
      setToast({ message: "Orders refreshed.", type: "success" });
    } catch (error) {
      console.error("Failed to refresh orders", error);
      setToast({ message: "Failed to refresh orders.", type: "error" });
    } finally {
      setIsWorking(false);
    }
  };

  // const downloadInvoiceFile = (order: Order) => {
  //   const invoiceContent = `
  //       INVOICE - Aura Jewels
  //       ==================================
  //       Order ID: ${order.id}
  //       Customer: ${order.customerName}
  //       Date: ${new Date(order.date).toLocaleDateString()}
  //       Status: ${order.status}
  //       ==================================
  //       Items:
  //       ----------------------------------
  //       ${order.items
  //         .map(
  //           (item) =>
  //             `${item.name.padEnd(30)} x ${item.quantity} | ${formatCurrency(
  //               item.price
  //             ).padStart(10)} | ${formatCurrency(
  //               item.price * item.quantity
  //             ).padStart(12)}`
  //         )
  //         .join("\n        ")}
  //       ----------------------------------
  //       Total Amount: ${formatCurrency(order.amount).padStart(21)}
  //       ==================================
  //       Thank you for your purchase!
  //       `;
  //   const blob = new Blob([invoiceContent], {
  //     type: "text/plain;charset=utf-8",
  //   });
  //   const url = URL.createObjectURL(blob);
  //   const link = document.createElement("a");
  //   link.href = url;
  //   link.download = `Invoice-${order.id}.txt`;
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  //   URL.revokeObjectURL(url);
  // };

  // const handleDownloadInvoice = async (order: Order) => {
  //   if (order.status === OrderStatus.Cancelled) {
  //     setToast({
  //       message: `Order #${order.id} is cancelled. Can't generate invoice.`,
  //       type: "error",
  //     });
  //     return;
  //   }

  //   if (
  //     order.status === OrderStatus.Completed ||
  //     order.status === OrderStatus.Dispatched
  //   ) {
  //     downloadInvoiceFile(order);
  //     addLog(`Invoice for Order #${order.id} downloaded.`);
  //     setToast({
  //       message: `Invoice for Order #${order.id} downloaded.`,
  //       type: "success",
  //     });
  //     return;
  //   }

  //   if (order.status !== OrderStatus.Accepted) {
  //     setToast({
  //       message: `Order #${order.id} must be 'Accepted' to generate an invoice.`,
  //       type: "error",
  //     });
  //     return;
  //   }

  //   try {
  //     const updatedOrder = await api.updateOrderStatus(
  //       order.id,
  //       OrderStatus.Dispatched
  //     );
  //     updateOrderInState(updatedOrder);
  //     downloadInvoiceFile(updatedOrder);
  //     addLog(
  //       `Invoice for Order #${order.id} generated and status updated to Dispatched.`,
  //       "success"
  //     );
  //     setToast({
  //       message: `Invoice for Order #${order.id} generated and status updated to Dispatched.`,
  //       type: "success",
  //     });
  //   } catch {
  //     setToast({
  //       message: `Failed to dispatch Order #${order.id}.`,
  //       type: "error",
  //     });
  //   }
  // };


  const handleDownloadInvoice = async (order: Order) => {
  if (order.status === OrderStatus.Cancelled) {
    setToast({
      message: `Order #${order.id} is cancelled. Can't generate invoice.`,
      type: "error",
    });
    return;
  }

  try {
    // ✅ Update status if needed
    if (order.status === OrderStatus.Pending || order.status === OrderStatus.Accepted) {
      const updatedOrder = await api.updateOrderStatus(order.id, OrderStatus.Dispatched);
      updateOrderInState(updatedOrder);
      order = updatedOrder;
    }

    // ✅ Generate the invoice dynamically using the new template
    const container = document.createElement("div");
    document.body.appendChild(container);

    const root = React.createElement(InvoiceTemplate, {
      order,
      business: {
        name: "Aura Jewels",
        logoUrl: "/logo.png",
        tagline: "Design & Branding",
        address: "3, Aishbagh, Lucknow, Uttar Pradesh",
        gst: "09EDGPS0111B1Z1",
        email: "info@aurajewels.com",
        phone: "+91 98765 43210",
      },
    });

    // Temporarily render the invoice offscreen and trigger its built-in PDF generator
    import("react-dom/client").then(({ createRoot }) => {
      const rootInstance = createRoot(container);
      rootInstance.render(root);
      setTimeout(() => {
        const btn = container.querySelector("button");
        if (btn) (btn as HTMLButtonElement).click(); // triggers DownloadInvoicePDF
        setTimeout(() => {
          rootInstance.unmount();
          document.body.removeChild(container);
        }, 3000);
      }, 800);
    });

    addLog(`Invoice for Order #${order.id} generated.`);
    setToast({ message: `Invoice #${order.id} generated successfully.`, type: "success" });
  } catch (err) {
    console.error("Invoice generation failed:", err);
    setToast({ message: "Failed to generate invoice.", type: "error" });
  }
};


  const handleChangeStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      setIsWorking(true);
      const updated = await api.updateOrderStatus(orderId, newStatus);
      updateOrderInState(updated);
      addLog(`Order #${orderId} status changed to ${newStatus}.`);
      setToast({ message: `Order #${orderId} updated.`, type: "success" });
    } catch (e) {
      setToast({ message: `Failed to update status for #${orderId}.`, type: "error" });
    } finally {
      setIsWorking(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!editingOrder) return;
    try {
      await api.deleteOrder(editingOrder.id);
      setOrders(safeOrders.filter((o) => o.id !== editingOrder.id));
      addLog(`Order #${editingOrder.id} deleted.`, "warning");
      setToast({ message: `Order #${editingOrder.id} deleted.`, type: "success" });
      setIsOrderFormOpen(false);
      setEditingOrder(null);
    } catch (e) {
      setToast({ message: `Failed to delete order #${editingOrder.id}.`, type: "error" });
    }
  };



const generatePDFInvoice = async (order: Order) => {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const root = React.createElement(InvoiceTemplate, {
    order,
    business: {
      name: "Aura Jewels",
      logoUrl: "/logo.png",
      tagline: "Design & Branding",
      address: "3, Aishbagh, Lucknow, Uttar Pradesh",
      gst: "09EDGPS0111B1Z1",
      email: "info@aurajewels.com",
      phone: "+91 98765 43210",
    },
  });

  const { createRoot } = await import("react-dom/client");
  const rootInstance = createRoot(container);
  rootInstance.render(root);

  // Wait a bit for render
  setTimeout(() => {
    const btn = container.querySelector("button");
    if (btn) (btn as HTMLButtonElement).click(); // Triggers PDF download
    setTimeout(() => {
      rootInstance.unmount();
      document.body.removeChild(container);
    }, 3000);
  }, 800);
};


  const handleBulkInvoiceDownload = async () => {
    setIsBulkProcessing(true);
    try {
      const selectedOrders = safeOrders.filter((o) =>
        selectedOrderIds.has(o.id)
      );
      const cancelledOrders = selectedOrders.filter(
        (o) => o.status === OrderStatus.Cancelled
      );
      if (cancelledOrders.length > 0) {
        const orderIds = cancelledOrders.map((o) => o.id).join(", ");
        setToast({
          message: `Order(s) #${orderIds} are cancelled and will be skipped.`,
          type: "error",
        });
      }

      const processableOrders = selectedOrders.filter(
        (o) =>
          o.status === OrderStatus.Pending || o.status === OrderStatus.Accepted
      );

      if (processableOrders.length === 0) {
        if (cancelledOrders.length === 0)
          setToast({
            message: "No processable orders selected.",
            type: "error",
          });
        setSelectedOrderIds(new Set());
        return;
      }

      const updatePromises = processableOrders.map((order) =>
        api.updateOrderStatus(order.id, OrderStatus.Dispatched)
      );

      const updatedOrdersResults = await Promise.all(updatePromises);

      const newOrders = safeOrders.map((originalOrder) => {
        const updatedVersion = updatedOrdersResults.find(
          (u) => u.id === originalOrder.id
        );
        return updatedVersion || originalOrder;
      });
      setOrders(newOrders);

      for (const order of updatedOrdersResults) {
        await generatePDFInvoice(order);

        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      addLog(
        `${processableOrders.length} orders have been dispatched in bulk.`,
        "success"
      );
      setToast({
        message: `${processableOrders.length} orders have been dispatched.`,
        type: "success",
      });
      setSelectedOrderIds(new Set());
    } catch {
      setToast({
        message: "An error occurred during bulk processing.",
        type: "error",
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleDownloadExcel = () => {
    try {
      const dataToExport = sortedOrders.flatMap((order) =>
        order.items.map((item) => ({
          "Order ID": order.id,
          "Customer Name": order.customerName,
          Date: order.date,
          "Order Status": order.status,
          "Total Order Amount": order.amount,
          "Product Name": item.name,
          Quantity: item.quantity,
          "Price per Item": item.price,
          "Total Item Price": item.quantity * item.price,
        }))
      );

      if (dataToExport.length === 0) {
        setToast({ message: "No data to export.", type: "error" });
        return;
      }

      const worksheet = utils.json_to_sheet(dataToExport);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Orders");

      worksheet["!cols"] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 30 },
        { wch: 10 },
        { wch: 18 },
        { wch: 18 },
      ];

      writeFile(workbook, "Orders_Export.xlsx");
      addLog("Exported orders list to Excel.");
      setToast({ message: "Orders exported successfully!", type: "success" });
    } catch (error) {
      console.error("Failed to export orders:", error);
      setToast({ message: "Failed to export orders.", type: "error" });
    }
  };

  // const handleSaveOrder = async (customerName: string, items: ProductItem[], status: OrderStatus) => {
  //     try {
  //         const newOrderData = {
  //             customerName,
  //             items,
  //             status,
  //             date: new Date().toISOString(),
  //             amount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  //         };
  //         const newOrder = await api.createOrder(newOrderData);
  //         setOrders([newOrder, ...safeOrders]);
  //         addLog(`New order #${newOrder.id} for ${customerName} created.`, 'success');
  //         setToast({ message: `New order #${newOrder.id} created!`, type: 'success' });
  //         setIsOrderFormOpen(false);
  //     } catch {
  //         setToast({ message: 'Failed to create new order.', type: 'error' });
  //     }
  // };
  const handleSaveOrder = async (
    customer: { name: string; email: string; phone: string },
    items: ProductItem[],
    status: OrderStatus,
    paymentMethod: string,
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
    }
  ) => {
    try {
      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      if (editingOrder) {
        // Update existing order (orders app shape)
        const updatePayload: any = {
          status,
          items: items.map((i) => ({ name: i.name, sku: i.sku, price: i.price, quantity: i.quantity })),
          paymentMethod,
          address,
        };
        // Only include customer if fully provided to avoid backend validation errors
        if (customer.name && customer.email && customer.phone) {
          updatePayload.customer = customer;
        }
        const updated = await api.updateOrderDetails(editingOrder.id, updatePayload);
        updateOrderInState(updated);
        addLog(`Order #${editingOrder.id} updated.`, "success");
        setToast({ message: `Order #${editingOrder.id} updated!`, type: "success" });
        setIsOrderFormOpen(false);
        setEditingOrder(null);

        // Ask to generate invoice after edit
        const shouldGen = window.confirm(
          `Generate invoice for order #${updated.id} now?`
        );
        if (shouldGen) {
          handleDownloadInvoice(updated);
        }
        return;
      }

      // Create new order
      const newOrderData = {
        customer,
        items,
        status,
        paymentMethod,
        address,
        totalAmount,
      };
      const newOrder = await api.createOrder(newOrderData);
      // normalize before adding
      const norm = normalizeOrder(newOrder as any);
      setOrders([norm, ...safeOrders]);
      addLog(
        `New order #${norm.id} created for ${customer.name}.`,
        "success"
      );
      // Create notification for new order created
      try {
        await createNotification({
          title: "New Order",
          message: `Order #${norm.id} created for ${customer.name}`,
          type: NotificationType.NewOrder,
        });
        sessionStorage.setItem('refreshNotifications', '1');
      } catch {}
      setToast({
        message: `New order #${norm.id} created!`,
        type: "success",
      });
      setIsOrderFormOpen(false);
    } catch (err) {
      console.error("Create/update order failed:", err);
      setToast({ message: "Failed to save order.", type: "error" });
    }
  };

  const handleSort = (key: "date") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="container mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {isOrderFormOpen && (
        <OrderFormModal
          isOpen={isOrderFormOpen}
          onClose={() => setIsOrderFormOpen(false)}
          onSave={handleSaveOrder}
          initialData={editingOrder ? {
            customer: { name: editingOrder.customerName, email: editingOrder.customerEmail || "", phone: editingOrder.customerPhone || "" },
            items: editingOrder.items,
            status: editingOrder.status,
            paymentMethod: editingOrder.paymentMethod || "cod",
            address: editingOrder.address || { line1: "", city: "", state: "", pincode: "", line2: "" },
          } : undefined}
          isEditing={!!editingOrder}
          onDelete={editingOrder ? handleDeleteOrder : undefined}
          allProducts={allProducts}
        />
      )}
      <h1 className="text-3xl font-bold text-text-primary mb-6">
        Orders Management
      </h1>

      <div className="bg-card p-4 rounded-xl shadow-md mb-6 flex items-center justify-between flex-wrap gap-4">
        {/* View toggle */}
        <div className="flex items-center space-x-2 border border-gray-200 rounded-full p-1">
          <button
            onClick={() => setView("orders")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full ${
              view === "orders"
                ? "bg-primary text-white shadow"
                : "text-text-secondary hover:bg-gray-100"
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setView("invoices")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full ${
              view === "invoices"
                ? "bg-primary text-white shadow"
                : "text-text-secondary hover:bg-gray-100"
            }`}
          >
            Invoice History
          </button>
        </div>

        {/* Search + Status filter */}
        {view === "orders" && (
          <div className="flex items-center gap-3 flex-grow justify-center min-w-[280px]">
            <div className="relative w-full max-w-xs md:max-w-sm">
              <input
                type="text"
                placeholder="Search by customer or ID..."
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
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as OrderStatus | "All" | "In Progress"
                )
              }
              className="px-4 py-2 rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-primary w-44 md:w-56"
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value={OrderStatus.Pending}>Pending</option>
              <option value={OrderStatus.Dispatched}>Dispatched</option>
              <option value={OrderStatus.Completed}>Completed</option>
              <option value={OrderStatus.Cancelled}>Cancelled</option>
            </select>
          </div>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleRefreshOrders}
            disabled={isWorking}
            className="bg-white border border-gray-300 text-text-primary font-semibold py-2 px-4 rounded-lg hover:border-gray-400 transition flex items-center whitespace-nowrap disabled:opacity-60"
            title="Reload latest orders"
          >
            {isWorking ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m14.356 2A8 8 0 104.582 9M20 20v-5h-.581"
                  />
                </svg>
                Refresh
              </span>
            )}
          </button>
          {view === "orders" && selectedOrderIds.size > 0 && (
            <button
              onClick={handleBulkInvoiceDownload}
              disabled={isBulkProcessing}
              className="bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isBulkProcessing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                `Generate Invoices (${selectedOrderIds.size})`
              )}
            </button>
          )}
          <button
            onClick={handleDownloadExcel}
            className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center whitespace-nowrap"
          >
            {ICONS.download}
            <span className="ml-2">Export</span>
          </button>
          <button
            onClick={() => setIsOrderFormOpen(true)}
            className="bg-primary text-white font-semibold py-2 px-5 rounded-lg hover:bg-opacity-90 transition whitespace-nowrap"
          >
            + Add Order
          </button>
        </div>
      </div>

      {view === "orders" ? (
        <OrdersTable
          orders={sortedOrders}
          onAccept={handleAcceptOrder}
          onReject={handleRejectOrder}
          onDownloadInvoice={handleDownloadInvoice}
          onChangeStatus={handleChangeStatus}
          onEdit={(order) => { setEditingOrder(order); setIsOrderFormOpen(true); }}
          selectedOrderIds={selectedOrderIds}
          onSelectOrder={handleSelectOrder}
          onToggleSelectPage={handleToggleSelectPage}
          onSort={handleSort}
          sortConfig={sortConfig}
          loading={isWorking}
        />
      ) : (
        <InvoiceHistoryTable
          invoices={invoiceHistory}
          onDownloadInvoice={handleDownloadInvoice}
          loading={isWorking || isBulkProcessing}
        />
      )}
    </div>
  );
};

export default OrdersPage;
