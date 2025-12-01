import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { ICONS } from "../constants";
import { UserProfile, NotificationType, Log } from "../types";
import * as api from "../services/apiService";
import Toast from "../components/Toast";




const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const InfoRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
    <dt className="text-sm font-medium text-text-secondary">{label}</dt>
    <dd className="text-sm text-text-primary col-span-2">{value}</dd>
  </div>
);

const EditableInfoRow: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, value, onChange }) => (
  <div className="grid grid-cols-3 gap-4 py-2 items-center">
    <label htmlFor={name} className="text-sm font-medium text-text-secondary">
      {label}
    </label>
    <input
      type="text"
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      autoComplete="off"
      className="col-span-2 mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
    />
  </div>
);

interface ProfilePageProps {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  onLogout: () => void;
  addLog: (message: string, type?: Log["type"]) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  setProfile,
  onLogout,
  addLog,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile | null>(profile);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [activeTab, setActiveTab] = useState<
    "personal" | "business" | "notifications"
  >("personal");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleDiscard = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  // const handleSave = async () => {
  //     if (!formData) return;
  //     try {
  //         const updatedProfile = await api.updateUserProfile(formData);
  //         setProfile(updatedProfile);
  //         setIsEditing(false);
  //         addLog('User profile updated.', 'success');
  //         setToast({ message: 'Profile updated successfully!', type: 'success' });
  //     } catch (error) {
  //         setToast({ message: 'Failed to update profile.', type: 'error' });
  //     }
  // };
  const handleSave = async () => {
    if (!formData) return;
    try {
      // Compress granular toggles into 3 backend-supported flags
      const notify_orders = !!formData.notificationSettings[NotificationType.NewOrder];
      const notify_promotions = (
        formData.notificationSettings[NotificationType.BannerTimeout] ||
        formData.notificationSettings[NotificationType.DiscountTimeout] ||
        formData.notificationSettings[NotificationType.NewProductAdded] ||
        formData.notificationSettings[NotificationType.WelcomeMessage]
      );
      const notify_updates = (
        formData.notificationSettings[NotificationType.OrderDeclined] ||
        formData.notificationSettings[NotificationType.OrderStatusUpdate] ||
        formData.notificationSettings[NotificationType.ProductOutOfStock] ||
        formData.notificationSettings[NotificationType.ProductLowStock] ||
        formData.notificationSettings[NotificationType.ProductRemoved] ||
        formData.notificationSettings[NotificationType.PasswordReset]
      );

      const payload = {
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        recovery_email: formData.recoveryEmail,
        avatar: formData.avatarUrl,
        role: formData.role,
        business_name: formData.businessDetails.name,
        business_address: formData.businessDetails.address,
        gst_number: formData.businessDetails.gstNumber,
        pan_card: formData.businessDetails.panCard,
        notify_orders,
        notify_promotions,
        notify_updates,
      };

      // ✅ Update backend first
      await api.updateUserProfile(payload);
      const refreshed = await api.getUserProfile();
      setProfile(refreshed);
      setFormData(refreshed);
    setIsEditing(false);
      setToast({ message: "Profile updated successfully!", type: "success" });
    } catch (error: any) {
      console.error("Profile update error:", error.response?.data);
      setToast({
        message: "Failed to update profile. Please check fields.",
        type: "error",
      });
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    const { name, value } = e.target;

    // When editing Business tab, route fields to businessDetails, even if name == "name"
    if (activeTab === "business") {
      const keyMap: Record<string, keyof UserProfile["businessDetails"]> = {
        name: "name",
        address: "address",
        gstNumber: "gstNumber",
        panCard: "panCard",
      };
      const targetKey = keyMap[name] || (name as keyof UserProfile["businessDetails"]);
      setFormData((prev) => ({
        ...prev!,
        businessDetails: {
          ...prev!.businessDetails,
          [targetKey]: value as any,
        },
      }));
      return;
    }

    // Personal fields
    if (["name", "email", "phone", "role", "recoveryEmail"].includes(name)) {
      setFormData((prev) => ({ ...prev!, [name]: value }));
      return;
    }

    // Fallback: update businessDetails for other business-prefixed inputs
    setFormData((prev) => ({
      ...prev!,
      businessDetails: {
        ...prev!.businessDetails,
        [name]: value,
      },
    }));
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setFormData((prev) => ({ ...prev!, avatarUrl: base64 }));
    } catch (error) {
      console.error("Failed to convert image to base64", error);
    }
  };

  const handleNotificationSettingChange = (
    setting: NotificationType,
    value: boolean
  ) => {
    if (!formData) return;
    setFormData((prev) => ({
      ...prev!,
      notificationSettings: {
        ...prev!.notificationSettings,
        [setting]: value,
      },
    }));
  };

  if (!formData) {
    return <div className="text-center p-8">Loading profile...</div>;
  }
  // Add this right before "return ("
  if (!formData.businessDetails) {
    formData.businessDetails = {
      name: "",
      address: "",
      gstNumber: "",
      panCard: "",
    };
  }
  if (!formData.notificationSettings) {
    formData.notificationSettings = {
      orders: false,
      promotions: false,
      updates: false,
    };
  }

  return (
    <div className="container mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">My Profile</h1>
        <div>
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDiscard}
                className="text-text-secondary font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-opacity-90 transition"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-secondary text-white font-semibold py-2 px-5 rounded-lg hover:bg-opacity-90 transition flex items-center"
            >
              {ICONS.edit}
              <span className="ml-2">Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: User Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl shadow-md p-6 flex flex-col items-center text-center">
            <div className="relative group">
              <img
                src={formData.avatarUrl}
                alt={formData.name}
                className="w-32 h-32 rounded-full ring-4 ring-primary ring-opacity-50"
              />
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />

            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="text-2xl font-bold text-text-primary mt-4 bg-gray-100 rounded-md text-center p-1 w-full"
              />
            ) : (
              <h2 className="text-2xl font-bold text-text-primary mt-4">
                {formData.name}
              </h2>
            )}

            {isEditing ? (
              <input
                type="text"
                name="role"
                value={formData.role || ""}
                onChange={handleChange}
                className="text-text-secondary mt-1 bg-gray-100 rounded-md text-center p-1 w-full"
              />
            ) : (
              <p className="text-text-secondary mt-1">{formData.role}</p>
            )}

            <button
              onClick={onLogout}
              className="mt-6 w-full bg-red-50 text-red-600 font-semibold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300"
            >
              {ICONS.logout}
              <span className="ml-2">Logout</span>
            </button>
          </div>
        </div>
        {/* Right Column: Details Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card rounded-xl shadow-md">
            <div className="border-b border-gray-200">
              <nav className="flex items-center -mb-px px-6">
                <button
                  onClick={() => setActiveTab("personal")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "personal"
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-primary"
                  }`}
                >
                  Personal Details
                </button>
                <button
                  onClick={() => setActiveTab("business")}
                  className={`ml-8 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "business"
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-primary"
                  }`}
                >
                  Business Details
                </button>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`ml-8 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "notifications"
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-primary"
                  }`}
                >
                  Notifications
                </button>
              </nav>
            </div>
            <div className="p-6">
              {activeTab === "personal" &&
                (isEditing ? (
                  <dl>
                    <EditableInfoRow
                      label="Full Name"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleChange}
                    />
                    <EditableInfoRow
                      label="Email Address"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleChange}
                    />
                    <EditableInfoRow
                      label="Recovery Email"
                      name="recoveryEmail"
                      value={formData.recoveryEmail || ""}
                      onChange={handleChange}
                    />
                    <EditableInfoRow
                      label="Phone Number"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleChange}
                    />
                    <EditableInfoRow
                      label="Role"
                      name="role"
                      value={formData.role || ""}
                      onChange={handleChange}
                    />
                  </dl>
                ) : (
                  <dl>
                    <InfoRow label="Full Name" value={formData.name || ""} />
                    <InfoRow
                      label="Email Address"
                      value={formData.email || ""}
                    />
                    <InfoRow
                      label="Recovery Email"
                      value={formData.recoveryEmail || "Not set"}
                    />
                    <InfoRow
                      label="Phone Number"
                      value={formData.phone || ""}
                    />
                    <InfoRow label="Role" value={formData.role || ""} />
                  </dl>
                ))}
              {activeTab === "business" &&
                (isEditing ? (
                  <dl>
                    <EditableInfoRow
                      label="Business Name"
                      name="name"
                      value={formData.businessDetails.name || ""}
                      onChange={handleChange}
                    />
                    <EditableInfoRow
                      label="Registered Address"
                      name="address"
                      value={formData.businessDetails.address || ""}
                      onChange={handleChange}
                    />
                    <EditableInfoRow
                      label="GST Number"
                      name="gstNumber"
                      value={formData.businessDetails.gstNumber || ""}
                      onChange={handleChange}
                    />
                    <EditableInfoRow
                      label="PAN Card"
                      name="panCard"
                      value={formData.businessDetails.panCard || ""}
                      onChange={handleChange}
                    />
                  </dl>
                ) : (
                  <dl>
                    <InfoRow
                      label="Business Name"
                      value={formData.businessDetails.name || ""}
                    />
                    <InfoRow
                      label="Registered Address"
                      value={formData.businessDetails.address || ""}
                    />
                    <InfoRow
                      label="GST Number"
                      value={formData.businessDetails.gstNumber || ""}
                    />
                    <InfoRow
                      label="PAN Card"
                      value={formData.businessDetails.panCard || ""}
                    />
                  </dl>
                ))}
              {activeTab === "notifications" &&
                (isEditing ? (
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-text-primary">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Choose which notifications you want to receive by email.
                    </p>
                    {Object.values(NotificationType).map((type) => (
                      <div
                        key={type}
                        className="flex items-center justify-between py-2 border-b border-gray-100"
                      >
                        <span className="text-sm">{type}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.notificationSettings[type]}
                            onChange={(e) =>
                              handleNotificationSettingChange(
                                type,
                                e.target.checked
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h3 className="text-md font-semibold text-text-primary">
                      Email Notifications Settings
                    </h3>
                    <p className="text-sm text-text-secondary pb-2">
                      To change these settings, click the "Edit Profile" button.
                    </p>
                    {Object.entries(formData.notificationSettings).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center py-2 border-b border-gray-100"
                        >
                          <span
                            className={`w-2.5 h-2.5 mr-3 rounded-full ${
                              value ? "bg-green-500" : "bg-gray-300"
                            }`}
                          ></span>
                          <span className="text-sm flex-grow">{key}</span>
                          <span
                            className={`text-sm font-semibold ${
                              value ? "text-green-600" : "text-gray-500"
                            }`}
                          >
                            {value ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ))}
            </div>
          </div>

          {isEditing && (
            <div className="bg-card rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">
                Change Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="current"
                    value={passwordData.current}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="new"
                    value={passwordData.new}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirm"
                    value={passwordData.confirm}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

