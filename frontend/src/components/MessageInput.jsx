import { useState, useRef } from 'react';
import PrescriptionForm from './PrescriptionForm';
import AppointmentForm from './AppointmentForm';

export default function MessageInput({
  onSendMessage,
  onTyping,
  onStopTyping,
  otherUserRole,
  currentUserRole,
  onCreateAppointment,
}) {
  const [message, setMessage] = useState('');
  const [showPrescription, setShowPrescription] = useState(false);
  const [showAppointment, setShowAppointment] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    if (value && !typingTimeoutRef.current) {
      onTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
      typingTimeoutRef.current = null;
    }, 3000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      onStopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const handlePrescriptionSubmit = (prescriptionData) => {
    onSendMessage(
      prescriptionData.note || 'New prescription',
      'prescription',
      prescriptionData
    );
    setShowPrescription(false);
  };

  const handleAppointmentSubmit = (appointmentData) => {
    if (onCreateAppointment) {
      onCreateAppointment(appointmentData);
    } else {
      onSendMessage(
        `Appointment proposal: ${new Date(
          appointmentData.proposedTime
        ).toLocaleString()}`,
        'appointment',
        appointmentData
      );
    }
    setShowAppointment(false);
  };

  const isDoctorMode = currentUserRole === 'doctor' && otherUserRole === 'patient';

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Prescription Modal */}
      {showPrescription && (
        <PrescriptionForm
          onSubmit={handlePrescriptionSubmit}
          onClose={() => setShowPrescription(false)}
        />
      )}

      {/* Appointment Modal */}
      {showAppointment && (
        <AppointmentForm
          onSubmit={handleAppointmentSubmit}
          onClose={() => setShowAppointment(false)}
        />
      )}

      {/* Doctor Actions */}
      {isDoctorMode && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setShowPrescription(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium"
          >
            💊 Prescription
          </button>
          <button
            onClick={() => setShowAppointment(true)}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium"
          >
            📅 Appointment
          </button>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          Send
        </button>
      </form>
    </div>
  );
}
