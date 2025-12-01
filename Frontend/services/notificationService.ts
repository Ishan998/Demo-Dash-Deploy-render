import { Customer } from '../types';
import * as api from './apiService';

/**
 * Sends an email to a customer when their account is blocked or unblocked via the backend API.
 * @param customer The customer whose account status changed.
 * @param isBlocked True if the account is being blocked, false if unblocked.
 */
export const sendAccountBlockedEmail = async (customer: Customer, isBlocked: boolean): Promise<{ success: true }> => {
    const action = isBlocked ? 'blocked' : 'unblocked';
    const subject = `Your Account Has Been ${action.charAt(0).toUpperCase() + action.slice(1)}`;
    const body = isBlocked 
        ? `Hello ${customer.name},\n\nDue to a violation of our terms of service, we have blocked your account. You can contact customer support for more information.\n\nThank you,\nAura Jewels Team`
        : `Hello ${customer.name},\n\nYour account has been unblocked. You can now log in and place orders again.\n\nThank you,\nAura Jewels Team`;

    return api.sendEmailNotification({
        to: customer.email,
        subject,
        body,
    });
};

/**
 * Sends an email to a customer when their account is removed via the backend API.
 * @param customer The customer whose account was removed.
 */
export const sendAccountRemovedEmail = async (customer: Customer): Promise<{ success: true }> => {
    const subject = `Your Account Has Been Removed`;
    const body = `Hello ${customer.name},\n\nYour account with Aura Jewels has been permanently removed from our system. If you believe this was in error, please contact our support team.\n\nThank you,\nAura Jewels Team`;

    return api.sendEmailNotification({
        to: customer.email,
        subject,
        body,
    });
};
