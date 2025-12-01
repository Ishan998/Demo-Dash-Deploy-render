import React, { useState, useMemo, useEffect } from "react";
import { Discount, Product, DiscountStatus, Log } from "../types";
import DiscountsTable from "../components/DiscountsTable";
import DiscountFormModal from "../components/DiscountFormModal";
import ShareDiscountModal from "../components/ShareDiscountModal";
import * as api from "../services/apiService";
import Toast from "../components/Toast";
import { InitialPageProps } from "../App";

interface DiscountsPageProps {
  discounts: Discount[];
  setDiscounts: (discounts: Discount[]) => void;
  allProducts: Product[];
  addLog: (message: string, type?: Log["type"]) => void;
  initialProps: (InitialPageProps & { onApplied: () => void }) | null;
}

const DiscountsPage: React.FC<DiscountsPageProps> = ({
  discounts,
  setDiscounts,
  allProducts,
  addLog,
  initialProps,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DiscountStatus | "All">(
    "All"
  );
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [sharingDiscount, setSharingDiscount] = useState<Discount | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (initialProps) {
      if (initialProps.searchTerm) setSearchTerm(initialProps.searchTerm);
      if (initialProps.statusFilter)
        setStatusFilter(initialProps.statusFilter as any);
      initialProps.onApplied();
    }
  }, [initialProps]);

  // const filteredDiscounts = useMemo(() => {
  //     return discounts.filter(discount => {
  //         const matchesSearch = discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //                               discount.code.toLowerCase().includes(searchTerm.toLowerCase());
  //         const matchesStatus = statusFilter === 'All' || discount.status === statusFilter;
  //         return matchesSearch && matchesStatus;
  //     });
  // }, [discounts, searchTerm, statusFilter]);
  const filteredDiscounts = useMemo(() => {
    return discounts.filter((discount) => {
      const name = discount.name ? discount.name.toLowerCase() : "";
      const code = discount.code ? discount.code.toLowerCase() : "";

      const matchesSearch =
        name.includes(searchTerm.toLowerCase()) ||
        code.includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || discount.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [discounts, searchTerm, statusFilter]);

  const handleAddDiscount = () => {
    setEditingDiscount(null);
    setIsFormModalOpen(true);
  };

  const handleEditDiscount = (discount: Discount) => {
    setEditingDiscount(discount);
    setIsFormModalOpen(true);
  };

  const handleShareDiscount = (discount: Discount) => {
    setSharingDiscount(discount);
    setIsShareModalOpen(true);
  };

  // const handleSaveDiscount = async (discountData: Omit<Discount, 'id' | 'usageCount'> | Discount) => {
  //     try {
  //         if ('id' in discountData && discountData.id) {
  //             const updatedDiscount = await api.updateDiscount(discountData as Discount);
  //             setDiscounts(discounts.map(d => d.id === updatedDiscount.id ? updatedDiscount : d));
  //             addLog(`Discount "${updatedDiscount.name}" updated.`, 'success');
  //             setToast({ message: 'Discount updated!', type: 'success' });
  //         } else {
  //             const newDiscount = await api.createDiscount(discountData);
  //             setDiscounts([newDiscount, ...discounts]);
  //             addLog(`Discount "${newDiscount.name}" created.`, 'success');
  //             setToast({ message: 'Discount created!', type: 'success' });
  //         }
  //         setIsFormModalOpen(false);
  //     } catch (error) {
  //         setToast({ message: 'Failed to save discount.', type: 'error' });
  //     }
  // };
  
  const handleSaveDiscount = async (discountData: DiscountCreate | DiscountUpdate) => {
  try {
    if ("id" in discountData) {
      // update
      const updatedDiscount = await api.updateDiscount(discountData);
      setDiscounts(discounts.map(d => d.id === updatedDiscount.id ? updatedDiscount : d));
      addLog(`Discount "${updatedDiscount.name}" updated.`, "success");
      setToast({ message: "Discount updated!", type: "success" });
    } else {
      // create
      const newDiscount = await api.createDiscount(discountData);
      setDiscounts([newDiscount, ...discounts]);
      addLog(`Discount "${newDiscount.name}" created.`, "success");
      setToast({ message: "Discount created!", type: "success" });
    }
    setIsFormModalOpen(false);
  } catch (error) {
    setToast({ message: "Failed to save discount.", type: "error" });
  }
};


  const handleDeleteDiscount = async (discountId: number) => {
    try {
      const discountToDelete = discounts.find((d) => d.id === discountId);
      await api.deleteDiscount(discountId);
      setDiscounts(discounts.filter((d) => d.id !== discountId));
      if (discountToDelete) {
        addLog(`Discount "${discountToDelete.name}" deleted.`, "warning");
      }
      setToast({ message: "Discount deleted.", type: "success" });
    } catch (error) {
      setToast({ message: "Failed to delete discount.", type: "error" });
    }
  };

  const handleToggleStatus = async (discount: Discount) => {
    const newStatus =
      discount.status === DiscountStatus.Active
        ? DiscountStatus.Inactive
        : DiscountStatus.Active;
    try {
      const updatedDiscount = await api.updateDiscount({
        ...discount,
        status: newStatus,
      });
      setDiscounts(
        discounts.map((d) =>
          d.id === updatedDiscount.id ? updatedDiscount : d
        )
      );
      addLog(`Discount "${discount.name}" status set to ${newStatus}.`);
      setToast({
        message: `Discount status set to ${newStatus}.`,
        type: "success",
      });
    } catch (error) {
      setToast({ message: "Failed to update status.", type: "error" });
    }
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
      <h1 className="text-3xl font-bold text-text-primary mb-6">
        Discount Management
      </h1>

      <div className="bg-card p-4 rounded-xl shadow-md mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search by name or code..."
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
          {/* <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as DiscountStatus | 'All')}
                        className="px-4 py-2 rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="All">All Statuses</option>
                        <option value={DiscountStatus.Active}>Active</option>
                        <option value={DiscountStatus.Inactive}>Inactive</option>
                        <option value={DiscountStatus.Scheduled}>Scheduled</option>
                    </select> */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as DiscountStatus | "All")
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        <button
          onClick={handleAddDiscount}
          className="bg-primary text-white font-semibold py-2 px-5 rounded-lg hover:bg-opacity-90 transition"
        >
          + Add Discount
        </button>
      </div>

      <DiscountsTable
        discounts={filteredDiscounts}
        onEdit={handleEditDiscount}
        onDelete={handleDeleteDiscount}
        onToggleStatus={handleToggleStatus}
        onShare={handleShareDiscount}
      />

      {isFormModalOpen && (
        <DiscountFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSaveDiscount}
          discountToEdit={editingDiscount}
          allProducts={allProducts}
        />
      )}

      {isShareModalOpen && sharingDiscount && (
        <ShareDiscountModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          discount={sharingDiscount}
          setToast={setToast}
        />
      )}
    </div>
  );
};

export default DiscountsPage;
