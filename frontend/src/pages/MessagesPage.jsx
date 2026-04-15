import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ConversationsList from '../components/ConversationsList';
import { getDefaultRouteForRole } from '../utils/navigation.js';

export default function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const dashboardPath = getDefaultRouteForRole(user.role);

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">
            Your conversations with doctors
          </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(dashboardPath)}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              Dashboard
            </button>
            {user?.role === 'patient' && (
              <button
                onClick={() => navigate('/patient-home')}
                className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Find Doctors
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <ConversationsList />
      </div>
    </div>
  );
}
