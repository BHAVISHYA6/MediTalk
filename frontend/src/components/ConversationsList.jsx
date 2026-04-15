import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../services/axios.jsx';

export default function ConversationsList() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/chat/conversations');
      setConversations(response.data.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="divide-y divide-gray-200">
        {conversations.map((conversation) => {
          // Find the other participant (not current user)
          const otherUser = conversation.participants?.find(
            (p) => p._id !== user.id
          );

          return (
            <button
              key={conversation._id}
              onClick={() => navigate(`/chat/${otherUser?._id}`)}
              className="w-full p-4 hover:bg-gray-50 text-left transition-colors flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {otherUser?.name || 'Unknown'}
                </h3>
                {otherUser?.role === 'doctor' && (
                  <p className="text-sm text-gray-500">
                    {otherUser?.specialization || 'Doctor'}
                  </p>
                )}
                {conversation.lastMessage && (
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {conversation.lastMessage}
                  </p>
                )}
              </div>
              {conversation.lastMessageTime && (
                <p className="text-xs text-gray-400 ml-2">
                  {new Date(conversation.lastMessageTime).toLocaleDateString()}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
