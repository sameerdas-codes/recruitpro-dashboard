import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import useNotifications from "../hooks/useNotifications";

function NotificationBell() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <button
      type="button"
      onClick={() => navigate("/notifications")}
      aria-label={`Notifications, ${unreadCount} unread`}
      className="relative text-gray-300 hover:text-white"
    >
      <FaBell className="text-xl" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
