import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/notifications/");
      setNotifications(response.data);
      setError("");
    } catch (error) {
      console.error("Error loading notifications:", error);
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read/`);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? response.data : notification,
        ),
      );
      return response.data;
    } catch (markError) {
      console.error("Error marking notification as read:", markError);
      throw markError;
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  return {
    notifications,
    unreadCount,
    refreshNotifications,
    markAsRead,
    loading,
    error,
  };
}
