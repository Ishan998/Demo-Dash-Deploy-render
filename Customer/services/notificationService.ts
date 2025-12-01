
import { sampleNotifications } from '../constants';
import type { Notification } from '../types';

// This is a mock function simulating an API call to a Django backend.
// In a real application, you would replace this with an Axios GET request.
export const fetchNotifications = async (isLoggedIn: boolean): Promise<Notification[]> => {
  console.log(`Fetching notifications from mock backend... (isLoggedIn: ${isLoggedIn})`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, you would use axios like this:
  // try {
  //   // The backend would handle filtering based on the user's session
  //   const response = await axios.get('/api/notifications/');
  //   return response.data;
  // } catch (error) {
  //   console.error("Failed to fetch notifications:", error);
  //   return [];
  // }
  
  if (!isLoggedIn) {
    // If the user is not logged in, filter out order-specific notifications.
    return sampleNotifications.filter(n => n.type !== 'shipping');
  }
  
  return sampleNotifications; // Logged-in users see all notifications
};
