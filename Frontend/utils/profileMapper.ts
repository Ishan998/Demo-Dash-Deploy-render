export const mapBackendToFrontendProfile = (data: any) => {
  // If already normalized, pass through
  if (data && typeof data === 'object' && 'name' in data && 'businessDetails' in data) {
    return data;
  }

  const toBool = (v: any) => Boolean(v);
  const profile = {
    id: String(data?.id ?? ""),
    name: data?.full_name || "",
    email: data?.email || "",
    phone: data?.phone || "",
    recoveryEmail: data?.recovery_email || "",
    avatarUrl: data?.avatar || "",
    role: data?.role || "",
    businessDetails: {
      name: data?.business_name || "",
      address: data?.business_address || "",
      gstNumber: data?.gst_number || "",
      panCard: data?.pan_card || "",
    },
    notificationSettings: {
      new_order: toBool(data?.notify_orders),
      order_declined: toBool(data?.notify_updates),
      order_status_update: toBool(data?.notify_updates),
      banner_timeout: toBool(data?.notify_promotions),
      discount_timeout: toBool(data?.notify_promotions),
      product_out_of_stock: toBool(data?.notify_updates),
      product_low_stock: toBool(data?.notify_updates),
      new_product_added: toBool(data?.notify_promotions),
      product_removed: toBool(data?.notify_updates),
      welcome_message: toBool(data?.notify_promotions),
      password_reset: toBool(data?.notify_updates),
    },
  };
  return profile;
};
