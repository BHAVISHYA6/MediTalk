import { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';

export default function MessageList({
  messages,
  currentUserId,
  currentUserRole,
  onAppointmentAction,
  onJoinMeeting,
  onEndConsultation,
  appointmentActionLoadingId,
  onPaymentRequired,
  appointmentPaymentStatus,
  onDownloadPrescription,
  onDownloadPaymentReceipt,
}) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No messages yet</p>
          <p className="text-gray-400 text-sm">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white p-4 space-y-4">
      {messages.map((message, index) => (
        <div key={message._id || index}>
          <MessageItem
            message={message}
            isOwn={message.senderId._id === currentUserId || message.senderId === currentUserId}
            currentUserRole={currentUserRole}
            onAppointmentAction={onAppointmentAction}
            onJoinMeeting={onJoinMeeting}
            onEndConsultation={onEndConsultation}
            appointmentActionLoadingId={appointmentActionLoadingId}
            onPaymentRequired={onPaymentRequired}
            appointmentPaymentStatus={appointmentPaymentStatus}
            onDownloadPrescription={onDownloadPrescription}
            onDownloadPaymentReceipt={onDownloadPaymentReceipt}
          />
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
