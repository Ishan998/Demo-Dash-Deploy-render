import React, { useState } from 'react';
import type { Address } from '../types';
import { TrashIcon } from '../components/Icon';
import { addAddress, updateAddress, deleteAddress } from '../services/apiService';

interface MyAddressTabProps {
  addresses: Address[];
  onUpdateAddresses: (addresses: Address[]) => void;
}

type AddressFormState = {
  id?: number;
  type: Address['type'];
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
};

const mapApiAddressToClient = (addr: any): Address => ({
  id: addr.id,
  type: (addr.type as Address['type']) || (addr.is_default ? 'Home' : 'Work'),
  line1: addr.line1 ?? '',
  line2: addr.line2 ?? '',
  city: addr.city ?? '',
  state: addr.state ?? '',
  zip: addr.zip ?? addr.pincode ?? '',
  country: addr.country ?? 'India',
  isDefault: Boolean(addr.is_default ?? addr.isDefault),
});

const blankForm: AddressFormState = {
  type: 'Home',
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: '',
  country: 'India',
  isDefault: false,
};

const MyAddressTab: React.FC<MyAddressTabProps> = ({ addresses, onUpdateAddresses }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<AddressFormState>(blankForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasCapacity = addresses.length < 6;

  const resetForm = (makeDefault = false) => {
    setFormData({ ...blankForm, isDefault: makeDefault });
    setEditingId(null);
    setFormError(null);
  };

  const handleDelete = async (id: number) => {
    if (addresses.find(a => a.id === id && a.isDefault)) {
        alert("Cannot delete the default address.");
        return;
    }
    try {
      await deleteAddress(id);
      onUpdateAddresses(addresses.filter(addr => addr.id !== id));
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Unable to delete address. Please try again.';
      console.error('Failed to delete address', error);
      alert(message);
    }
  };

  const handleEdit = (addr: Address) => {
    setIsFormOpen(true);
    setEditingId(addr.id);
    setFormError(null);
    setFormData({
      id: addr.id,
      type: addr.type,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      isDefault: addr.isDefault,
    });
  };

  const validateForm = () => {
    if (!formData.line1.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zip.trim()) {
      setFormError('Please fill in line 1, city, state, and pincode.');
      return false;
    }
    if (!/^[0-9]{6}$/.test(formData.zip.trim())) {
      setFormError('Please enter a valid 6-digit pincode.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setFormError(null);
    const payload = {
      line1: formData.line1.trim(),
      line2: formData.line2?.trim() || undefined,
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.zip.trim(),
      is_default: formData.isDefault,
    };

    try {
      console.log('[MyAddressTab] Saving address payload:', payload);
      const saved = editingId
        ? await updateAddress(editingId, payload)
        : await addAddress(payload);

      const normalized = mapApiAddressToClient(saved);

      let updatedAddresses = editingId
        ? addresses.map(addr => (addr.id === editingId ? normalized : addr))
        : [normalized, ...addresses];

      if (normalized.isDefault) {
        updatedAddresses = updatedAddresses.map(addr =>
          addr.id === normalized.id ? normalized : { ...addr, isDefault: false }
        );
      }

      onUpdateAddresses(updatedAddresses);
      resetForm(false);
      setIsFormOpen(false);
    } catch (error: any) {
      console.error('Failed to save address', error);
      const resp = error?.response?.data;
      if (resp) {
        if (typeof resp === 'string') {
          setFormError(resp);
        } else if (resp.detail) {
          setFormError(resp.detail);
        } else {
          const combined = Object.entries(resp)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join(' | ');
          setFormError(combined || 'Unable to save address. Please try again.');
        }
      } else {
        setFormError('Unable to save address. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startCreate = () => {
    setIsFormOpen(true);
    setEditingId(null);
    setFormError(null);
    setFormData({ ...blankForm, isDefault: addresses.length === 0 });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Addresses</h2>
        {hasCapacity && (
            <button
              onClick={startCreate}
              className="bg-black text-white font-bold py-2 px-4 rounded-md hover:bg-gray-800 text-sm"
            >
              Add New Address
            </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">You can save up to 6 addresses.</p>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{editingId ? 'Edit Address' : 'Add New Address'}</h3>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => { setIsFormOpen(false); resetForm(false); }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-black text-white font-bold py-2 px-4 rounded-md hover:bg-gray-800 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
              </button>
            </div>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Label</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Address['type'] }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37]"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
              </select>
            </div>
            <div className="flex items-center mt-6">
              <label className="flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="mr-2"
                />
                Set as default
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
              <input
                type="text"
                value={formData.line1}
                onChange={(e) => setFormData(prev => ({ ...prev, line1: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                placeholder="House number, building, street"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address Line 2 (Optional)</label>
              <input
                type="text"
                value={formData.line2}
                onChange={(e) => setFormData(prev => ({ ...prev, line2: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                placeholder="Landmark, area"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Pincode</label>
              <input
                type="text"
                value={formData.zip}
                onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="6-digit pincode"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37]"
              />
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map(addr => (
          <div key={addr.id} className="border p-4 rounded-lg bg-gray-50">
            <div className="flex items-start justify-between">
                <div>
                    <p className="font-bold text-gray-800">{addr.type || 'Address'}</p>
                    <address className="text-sm text-gray-600 not-italic mt-1">
                        {addr.line1}{addr.line2 && `, ${addr.line2}`} <br/>
                        {addr.city}, {addr.state} - {addr.zip}
                    </address>
                </div>
                <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-4">
                    {addr.isDefault && <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">Default</span>}
                    <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(addr)}
                          className="text-xs text-[#D4AF37] font-semibold p-1 hover:underline"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDelete(addr.id)} className="text-gray-400 hover:text-red-500 p-1">
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                </div>
            </div>
          </div>
        ))}
         {addresses.length === 0 && <p className="text-gray-500 col-span-full text-center py-8">No addresses saved.</p>}
      </div>
    </div>
  );
};

export default MyAddressTab;
