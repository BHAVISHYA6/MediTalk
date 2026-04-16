import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../services/axios.jsx';
import { appointmentService } from '../services/appointmentService.jsx';
import { doctorService } from '../services/doctorService.jsx';
import { paymentService } from '../services/paymentService.jsx';
import {
  initializeSocket,
  sendMessage,
  emitUserTyping,
  emitUserStopTyping,
} from '../services/socketService';
import MessageInput from '../components/MessageInput';
import MessageList from '../components/MessageList';
import MandatoryRatingModal from '../components/MandatoryRatingModal.jsx';
import PaymentModal from '../components/PaymentModal.jsx';
import PrescriptionForm from '../components/PrescriptionForm.jsx';

export default function ChatPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [appointmentActionLoadingId, setAppointmentActionLoadingId] = useState(null);
  const [pendingRatings, setPendingRatings] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [completedAppointment, setCompletedAppointment] = useState(null);
  const [appointmentPaymentStatus, setAppointmentPaymentStatus] = useState({});
  const backPath = '/messages';

  // Initialize socket and fetch chat history
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    initializeSocket(user.id);
    
    fetchChatHistory();
    fetchOtherUserDetails();
    fetchPendingRatings();
  }, [userId, user, navigate]);

  const fetchPendingRatings = async () => {
    if (user?.role !== 'patient') return;

    try {
      const response = await doctorService.getPendingRatings();
      setPendingRatings(response.data || []);
    } catch (err) {
      console.error('Error fetching pending ratings in chat:', err);
    }
  };

  // Setup real-time message listeners reliably for the active chat.
  useEffect(() => {
    if (!user?.id || !userId) return;

    const socket = initializeSocket(user.id);

    const handleReceiveMessage = (message) => {
      const sender = message?.senderId?._id || message?.senderId;
      const receiver = message?.receiverId?._id || message?.receiverId;

      // Only append messages for the currently opened chat thread.
      const belongsToActiveChat =
        (String(sender) === String(userId) && String(receiver) === String(user.id)) ||
        (String(sender) === String(user.id) && String(receiver) === String(userId));

      if (belongsToActiveChat) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleUserTyping = ({ senderName }) => {
      setTypingUser(senderName);
      setIsTyping(true);
    };

    const handleUserStopTyping = () => {
      setIsTyping(false);
      setTypingUser(null);
    };

    const handlePaymentCompleted = ({ appointmentId }) => {
      if (!appointmentId) return;
      setAppointmentPaymentStatus((prev) => ({
        ...prev,
        [String(appointmentId)]: 'completed',
      }));
    };

    const handleAppointmentStatusUpdated = ({ appointmentId, status, appointment }) => {
      // Show payment modal for patient when appointment is completed
      if (status === 'completed' && user?.role === 'patient') {
        setCompletedAppointment(appointment);
        setShowPaymentModal(true);
      }

      setMessages((prev) =>
        prev.map((msg) => {
          const msgAppointmentId = msg.metadata?.appointmentId;
          if (String(msgAppointmentId) !== String(appointmentId)) return msg;

          return {
            ...msg,
            metadata: {
              ...(msg.metadata || {}),
              appointmentId,
              status,
              proposedTime: appointment?.startTime || msg.metadata?.proposedTime,
              endTime: appointment?.endTime || msg.metadata?.endTime,
              duration:
                appointment?.startTime && appointment?.endTime
                  ? Math.max(
                      1,
                      Math.round(
                        (new Date(appointment.endTime).getTime() -
                          new Date(appointment.startTime).getTime()) /
                          (1000 * 60)
                      )
                    )
                  : msg.metadata?.duration,
              notes: appointment?.notes ?? msg.metadata?.notes,
              hasJoined:
                typeof appointment?.hasJoined === 'boolean'
                  ? appointment.hasJoined
                  : msg.metadata?.hasJoined,
              joinedAt: appointment?.joinedAt || msg.metadata?.joinedAt,
              isMeetingCompleted:
                typeof appointment?.isMeetingCompleted === 'boolean'
                  ? appointment.isMeetingCompleted
                  : msg.metadata?.isMeetingCompleted,
              endedBy: appointment?.endedBy || msg.metadata?.endedBy,
              cancellationReason: appointment?.cancellationReason || msg.metadata?.cancellationReason,
            },
          };
        })
      );
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('appointment_status_updated', handleAppointmentStatusUpdated);
    socket.on('payment_completed', handlePaymentCompleted);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('appointment_status_updated', handleAppointmentStatusUpdated);
      socket.off('payment_completed', handlePaymentCompleted);
    };
  }, [user?.id, userId]);

  useEffect(() => {
    const completedAppointmentIds = [
      ...new Set(
        messages
          .filter(
            (msg) =>
              msg.messageType === 'appointment' &&
              msg.metadata?.appointmentId &&
              msg.metadata?.status === 'completed'
          )
          .map((msg) => String(msg.metadata.appointmentId))
      ),
    ];

    const unresolvedIds = completedAppointmentIds.filter(
      (appointmentId) => appointmentPaymentStatus[appointmentId] === undefined
    );

    if (unresolvedIds.length === 0) return;

    let cancelled = false;

    const fetchPaymentStatuses = async () => {
      for (const appointmentId of unresolvedIds) {
        try {
          const response = await paymentService.getPaymentStatus(appointmentId);
          const status = response?.data?.status || 'not_initiated';
          if (cancelled) return;
          setAppointmentPaymentStatus((prev) => ({
            ...prev,
            [String(appointmentId)]: status,
          }));
        } catch {
          if (cancelled) return;
          setAppointmentPaymentStatus((prev) => ({
            ...prev,
            [String(appointmentId)]: 'not_initiated',
          }));
        }
      }
    };

    fetchPaymentStatuses();

    return () => {
      cancelled = true;
    };
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/chat/history/${userId}`);
      setMessages(response.data.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherUserDetails = async () => {
    try {
      const response = await axiosInstance.get(`/auth/user/${userId}`);
      setOtherUser(response.data.data || response.data);
    } catch (err) {
      console.error('Error fetching user details:', err);
    }
  };

  const handleSendMessage = (text, messageType = 'text', metadata = null) => {
    if (!text.trim()) return;

    sendMessage(user.id, userId, text, messageType, metadata);
    
    // Add message optimistically
    const newMessage = {
      _id: Date.now(),
      senderId: { _id: user.id, name: user.name, email: user.email },
      text,
      messageType,
      metadata,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleTyping = () => {
    emitUserTyping(userId, user.name);
  };

  const handleStopTyping = () => {
    emitUserStopTyping(userId);
  };

  const handleCreateAppointment = async ({ proposedTime, duration, notes }) => {
    try {
      const response = await appointmentService.createAppointment({
        doctorId: user.id,
        patientId: userId,
        proposedTime,
        duration,
        createdVia: 'chat',
        notes,
      });

      const appointment = response.data;
      const metadata = {
        appointmentId: appointment._id,
        proposedTime: appointment.startTime,
        endTime: appointment.endTime,
        duration,
        notes: appointment.notes,
        status: appointment.status,
        createdVia: 'chat',
        hasJoined: appointment.hasJoined,
        joinedAt: appointment.joinedAt,
        isMeetingCompleted: appointment.isMeetingCompleted,
        endedBy: appointment.endedBy,
        cancellationReason: appointment.cancellationReason,
      };

      const text = `Appointment proposal: ${new Date(appointment.startTime).toLocaleString()}`;
      handleSendMessage(text, 'appointment', metadata);
    } catch (err) {
      console.error('Error creating appointment from chat:', err);
      alert(err.response?.data?.message || 'Unable to create appointment');
    }
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      setAppointmentActionLoadingId(appointmentId);

      const response =
        action === 'confirm'
          ? await appointmentService.confirmAppointment(appointmentId)
          : await appointmentService.cancelAppointment(appointmentId);

      const updated = response.data;

      setMessages((prev) =>
        prev.map((msg) => {
          if (String(msg.metadata?.appointmentId) !== String(appointmentId)) return msg;
          return {
            ...msg,
            metadata: {
              ...(msg.metadata || {}),
              status: updated.status,
              proposedTime: updated.startTime || msg.metadata?.proposedTime,
              endTime: updated.endTime || msg.metadata?.endTime,
              hasJoined:
                typeof updated.hasJoined === 'boolean'
                  ? updated.hasJoined
                  : msg.metadata?.hasJoined,
              joinedAt: updated.joinedAt || msg.metadata?.joinedAt,
              isMeetingCompleted:
                typeof updated.isMeetingCompleted === 'boolean'
                  ? updated.isMeetingCompleted
                  : msg.metadata?.isMeetingCompleted,
              endedBy: updated.endedBy || msg.metadata?.endedBy,
              cancellationReason: updated.cancellationReason || msg.metadata?.cancellationReason,
            },
          };
        })
      );
    } catch (err) {
      console.error('Error updating appointment from chat:', err);
      alert(err.response?.data?.message || 'Unable to update appointment');
    } finally {
      setAppointmentActionLoadingId(null);
    }
  };

  const handleJoinMeeting = async (appointmentId) => {
    try {
      const joinLinkResponse = await appointmentService.getJoinLink(appointmentId);
      const meetingLink = joinLinkResponse.data?.meetingLink;
      const response = await appointmentService.joinAppointment(appointmentId);
      const updated = response.data;

      setMessages((prev) =>
        prev.map((msg) => {
          if (String(msg.metadata?.appointmentId) !== String(appointmentId)) return msg;
          return {
            ...msg,
            metadata: {
              ...(msg.metadata || {}),
              hasJoined: updated.hasJoined,
              joinedAt: updated.joinedAt || msg.metadata?.joinedAt,
            },
          };
        })
      );

      if (meetingLink) {
        window.open(meetingLink, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Error joining meeting from chat:', err);
      alert(err.response?.data?.message || 'Unable to join meeting');
    }
  };

  const handleEndConsultation = async (appointmentId) => {
    try {
      const response = await appointmentService.completeAppointment(appointmentId);
      const updated = response.data;

      setMessages((prev) =>
        prev.map((msg) => {
          if (String(msg.metadata?.appointmentId) !== String(appointmentId)) return msg;
          return {
            ...msg,
            metadata: {
              ...(msg.metadata || {}),
              status: updated.status,
              isMeetingCompleted: updated.isMeetingCompleted,
            },
          };
        })
      );

      fetchPendingRatings();
    } catch (err) {
      console.error('Error ending consultation from chat:', err);
      alert(err.response?.data?.message || 'Unable to end consultation');
    }
  };

  const handleRatingSubmitted = (appointmentId) => {
    setPendingRatings((prev) => prev.filter((appt) => String(appt._id) !== String(appointmentId)));
  };

  const handlePaymentSuccess = (paymentData) => {
    setShowPaymentModal(false);
    if (completedAppointment?._id) {
      setAppointmentPaymentStatus((prev) => ({
        ...prev,
        [String(completedAppointment._id)]: 'completed',
      }));
    }
    // Show notification that payment was successful
    if (completedAppointment) {
      alert('Payment successful! Doctor will send prescription shortly.');
    }
  };

  const handlePrescriptionSuccess = (prescriptionData) => {
    setShowPrescriptionForm(false);
    // Refresh messages to show the new prescription message
    fetchChatHistory();
    alert('Prescription sent successfully!');
  };

  const openPrescriptionForm = (appointment) => {
    setCompletedAppointment(appointment);
    setShowPrescriptionForm(true);
  };

  const findLatestPaidCompletedAppointment = () => {
    const appointmentMessages = messages
      .filter(
        (msg) =>
          msg.messageType === 'appointment' &&
          msg.metadata?.appointmentId &&
          msg.metadata?.status === 'completed'
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    for (const msg of appointmentMessages) {
      const appointmentId = String(msg.metadata.appointmentId);
      const paymentStatus =
        appointmentPaymentStatus[appointmentId] || msg.metadata?.paymentStatus || 'not_initiated';

      if (paymentStatus === 'completed') {
        return {
          _id: msg.metadata.appointmentId,
          ...msg.metadata,
        };
      }
    }

    return null;
  };

  const handleSendPrescription = () => {
    const paidAppointment = findLatestPaidCompletedAppointment();
    if (!paidAppointment) {
      alert('Prescription can only be sent after patient payment is completed for a completed appointment.');
      return;
    }

    openPrescriptionForm(paidAppointment);
  };

  const handlePaymentRequired = (appointmentMetadata) => {
    if (appointmentMetadata?.appointmentId) {
      const appointmentId = String(appointmentMetadata.appointmentId);
      const status =
        appointmentPaymentStatus[appointmentId] || appointmentMetadata?.paymentStatus || 'not_initiated';

      if (status === 'completed') {
        alert('Payment already completed for this appointment.');
        return;
      }

      // Set the completed appointment for the payment modal
      setCompletedAppointment({
        _id: appointmentMetadata.appointmentId,
        ...appointmentMetadata,
      });
      setShowPaymentModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchChatHistory}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] bg-gray-50">
      {user?.role === 'patient' && pendingRatings.length > 0 && (
        <MandatoryRatingModal
          appointment={pendingRatings[0]}
          onSubmitted={handleRatingSubmitted}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && completedAppointment && (
        <PaymentModal
          appointment={completedAppointment}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Prescription Form */}
      {showPrescriptionForm && completedAppointment && (
        <PrescriptionForm
          appointment={completedAppointment}
          onClose={() => setShowPrescriptionForm(false)}
          onSuccess={handlePrescriptionSuccess}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(backPath)}
            className="text-gray-600 hover:text-gray-900 mr-4"
          >
            ← Messages
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {otherUser?.name || 'Chat'}
            </h1>
            {otherUser?.role === 'doctor' && (
              <p className="text-sm text-gray-500">{otherUser?.specialization || 'Doctor'}</p>
            )}
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={user.id}
        currentUserRole={user.role}
        onAppointmentAction={handleAppointmentAction}
        onJoinMeeting={handleJoinMeeting}
        onEndConsultation={handleEndConsultation}
        appointmentActionLoadingId={appointmentActionLoadingId}
        onPaymentRequired={handlePaymentRequired}
        appointmentPaymentStatus={appointmentPaymentStatus}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <div className="px-4 py-2 bg-white border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {typingUser || 'Someone'} is typing...
          </p>
        </div>
      )}

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        otherUserRole={otherUser?.role}
        currentUserRole={user.role}
        onCreateAppointment={handleCreateAppointment}
        onSendPrescription={handleSendPrescription}
        canSendPrescription={Boolean(findLatestPaidCompletedAppointment())}
      />
    </div>
  );
}
