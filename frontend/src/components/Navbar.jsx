import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice.jsx';
import { initializeSocket, disconnectSocket } from '../services/socketService.jsx';
import axiosInstance from '../services/axios.jsx';
import { canUseMessaging, getDefaultRouteForRole } from '../utils/navigation.js';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dashboardPath = getDefaultRouteForRole(user?.role);
  const isMessagingEnabled = canUseMessaging(user?.role);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notificationUnreadCount, setNotificationUnreadCount] = React.useState(0);

  const fetchUnreadCount = React.useCallback(async () => {
    if (!isAuthenticated || !user?.id || !isMessagingEnabled) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await axiosInstance.get('/chat/unread-count');
      setUnreadCount(response.data?.data?.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [isAuthenticated, user?.id, isMessagingEnabled]);

  const fetchNotificationUnreadCount = React.useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setNotificationUnreadCount(0);
      return;
    }

    try {
      const response = await axiosInstance.get('/notifications');
      const notifications = response.data?.data || [];
      const unread = notifications.filter((notification) => !notification.isRead).length;
      setNotificationUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, [isAuthenticated, user?.id]);

  React.useEffect(() => {
    if (isAuthenticated && user?.id) {
      const socket = initializeSocket(user.id);
      const handleIncomingMessage = () => {
        fetchUnreadCount();
      };

      socket.on('receive_message', handleIncomingMessage);
      fetchUnreadCount();

      const intervalId = setInterval(fetchUnreadCount, 10000);

      return () => {
        socket.off('receive_message', handleIncomingMessage);
        clearInterval(intervalId);
      };
    }

    setUnreadCount(0);
    return undefined;
  }, [isAuthenticated, user?.id, fetchUnreadCount]);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchNotificationUnreadCount();
    }
  }, [location.pathname, isAuthenticated, fetchUnreadCount, fetchNotificationUnreadCount]);

  const handleLogout = () => {
    disconnectSocket();
    setUnreadCount(0);
    setNotificationUnreadCount(0);
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? dashboardPath : '/landing'} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">MediTalk</span>
          </Link>

          {/* Menu */}
          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {/* Messages Link */}
                <Link
                  to={dashboardPath}
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200"
                >
                  Dashboard
                </Link>

                {user?.role === 'patient' && (
                  <>
                    <Link
                      to="/patient-home"
                      className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200"
                    >
                      Find Doctors
                    </Link>
                    <Link
                      to="/patient-appointments"
                      className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200"
                    >
                      Appointments
                    </Link>
                  </>
                )}

                {user?.role === 'admin' && (
                  <Link
                    to="/admin/verify-doctors"
                    className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200"
                  >
                    Verify Doctors
                  </Link>
                )}

                {isMessagingEnabled && (
                  <Link
                    to="/messages"
                  className="relative text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200"
                >
                  💬 Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-4 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] leading-5 text-center font-semibold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  </Link>
                )}

                <Link
                  to="/notifications"
                  className="relative text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200"
                >
                  🔔 Notifications
                  {notificationUnreadCount > 0 && (
                    <span className="absolute -top-2 -right-4 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] leading-5 text-center font-semibold">
                      {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                    </span>
                  )}
                </Link>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/landing"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200"
                >
                  Home
                </Link>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
