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

      const unread = notifications.filter(
        (notification) => !notification.isRead
      ).length;

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
  }, [
    location.pathname,
    isAuthenticated,
    fetchUnreadCount,
    fetchNotificationUnreadCount,
  ]);

  const handleLogout = () => {
    disconnectSocket();

    setUnreadCount(0);
    setNotificationUnreadCount(0);

    dispatch(logout());

    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-grey-200 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link
            to={isAuthenticated ? dashboardPath : '/landing'}
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-orange-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-base sm:text-lg">M</span>
            </div>

            <span className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-grey-900 hidden sm:inline">
              MediTalk
            </span>
          </Link>

          {/* Menu */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 ml-auto">

            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardPath}
                  className="hidden lg:inline text-grey-700 hover:text-orange-600 text-sm font-medium transition-colors duration-200"
                >
                  Dashboard
                </Link>

                {user?.role === 'patient' && (
                  <>
                    <Link
                      to="/patient-home"
                      className="hidden lg:inline text-grey-700 hover:text-orange-600 text-sm font-medium transition-colors duration-200"
                    >
                      Find Doctors
                    </Link>

                    <Link
                      to="/patient-appointments"
                      className="hidden lg:inline text-grey-700 hover:text-orange-600 text-sm font-medium transition-colors duration-200"
                    >
                      Appointments
                    </Link>
                  </>
                )}

                {user?.role === 'admin' && (
                  <Link
                    to="/admin/verify-doctors"
                    className="hidden lg:inline text-grey-700 hover:text-orange-600 text-sm font-medium transition-colors duration-200"
                  >
                    Verify Doctors
                  </Link>
                )}

                {isMessagingEnabled && (
                  <Link
                    to="/messages"
                    className="relative text-grey-700 hover:text-orange-600 text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Messages</span>
                    <span className="sm:hidden">💬</span>

                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-3 min-w-5 h-5 px-1 rounded-full bg-orange-600 text-white text-[10px] sm:text-[11px] leading-5 text-center font-bold">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )}

                <Link
                  to="/notifications"
                  className="relative text-grey-700 hover:text-orange-600 text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Notifications</span>
                  <span className="sm:hidden">🔔</span>

                  {notificationUnreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 min-w-5 h-5 px-1 rounded-full bg-orange-600 text-white text-[10px] sm:text-[11px] leading-5 text-center font-bold">
                      {notificationUnreadCount > 99
                        ? '99+'
                        : notificationUnreadCount}
                    </span>
                  )}
                </Link>

                {/* User Info - Hidden on mobile */}
                <div className="hidden md:flex items-center gap-2 border-l border-grey-200 pl-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-grey-900">
                      {user?.name}
                    </p>

                    <p className="text-xs text-grey-500 capitalize">
                      {user?.role}
                    </p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 bg-white hover:bg-gray-200 text-black text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/landing"
                  className="text-gray-300 hover:text-white text-sm font-medium transition-all duration-200"
                >
                  Home
                </Link>

                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white text-sm font-medium transition-all duration-200"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="px-5 py-2 bg-white hover:bg-gray-200 text-black text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm"
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