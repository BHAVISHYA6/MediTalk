import { formatDistanceToNow } from 'date-fns';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import { canJoinAppointment, getJoinStatusText } from '../utils/time.js';

export default function MessageItem({
  message,
  isOwn,
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
  const formatTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'just now';
    }
  };

  const renderMessageContent = () => {
    if (message.messageType === 'prescription') {
      const prescriptionId = message.metadata?.prescriptionId;

      if (currentUserRole === 'patient') {
        return (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <p className="font-semibold text-blue-900 mb-2">💊 Prescription available</p>
            <p className="text-sm text-blue-700">
              Your prescription is ready as a PDF with the doctor name, consultation time, medicines, and notes.
            </p>
            {prescriptionId && onDownloadPrescription && (
              <button
                onClick={() => onDownloadPrescription(message.metadata)}
                className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Download PDF
              </button>
            )}
          </div>
        );
      }

      return (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
          <p className="font-semibold text-blue-900 mb-2">💊 Prescription</p>
          {message.metadata?.medicines && Array.isArray(message.metadata.medicines) && (
            <div className="mb-2">
              <p className="text-sm font-medium text-blue-800">Medicines:</p>
              <ul className="text-sm text-blue-700 list-disc list-inside">
                {message.metadata.medicines.map((med, idx) => (
                  <li key={idx}>
                    {med.name} - {med.dosage} ({med.frequency || med.timing})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {message.metadata?.notes && (
            <p className="text-sm text-blue-700">
              <span className="font-medium">Notes:</span> {message.metadata.notes}
            </p>
          )}
          {message.text && <p className="text-sm text-blue-700 mt-2">{message.text}</p>}
          {prescriptionId && onDownloadPrescription && (
            <button
              onClick={() => onDownloadPrescription(message.metadata)}
              className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Download PDF
            </button>
          )}
        </div>
      );
    }

    if (message.messageType === 'appointment') {
      const appointmentId = message.metadata?.appointmentId;
      const appointmentStatus = message.metadata?.status || 'pending';
      const paymentStatus = appointmentId
        ? appointmentPaymentStatus?.[String(appointmentId)] || message.metadata?.paymentStatus || 'not_initiated'
        : 'not_initiated';
      const isPaymentCompleted = paymentStatus === 'completed';
      const hasJoined = Boolean(message.metadata?.hasJoined);
      const appointmentTimeState = {
        status: appointmentStatus,
        proposedTime: message.metadata?.proposedTime,
        endTime: message.metadata?.endTime,
      };
      const canJoin = canJoinAppointment(appointmentTimeState);
      const joinStatusText = getJoinStatusText(appointmentTimeState);
      const canPatientRespond =
        currentUserRole === 'patient' && !isOwn && appointmentStatus === 'pending' && appointmentId;

      return (
        <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="font-semibold text-green-900">📅 Appointment</p>
            <AppointmentStatusBadge status={appointmentStatus} />
          </div>
          {message.metadata?.proposedTime && (
            <p className="text-sm text-green-700">
              <span className="font-medium">Proposed Time:</span>{' '}
              {new Date(message.metadata.proposedTime).toLocaleString()}
            </p>
          )}
          {message.metadata?.duration && (
            <p className="text-sm text-green-700">
              <span className="font-medium">Duration:</span> {message.metadata.duration} minutes
            </p>
          )}
          {joinStatusText && appointmentStatus === 'confirmed' && (
            <p className="text-xs text-green-800 mt-1">{joinStatusText}</p>
          )}
          {message.text && <p className="text-sm text-green-700 mt-2">{message.text}</p>}

          {appointmentStatus === 'confirmed' && appointmentId && (
            <div className="flex gap-2 mt-3">
              {canJoin && (
                <button
                  onClick={() => onJoinMeeting(appointmentId)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Join Meet
                </button>
              )}
              {hasJoined && (
                <button
                  onClick={() => onEndConsultation(appointmentId)}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  End Consultation
                </button>
              )}
            </div>
          )}

          {appointmentStatus === 'completed' && currentUserRole === 'patient' && !isOwn && appointmentId && (
            <div className="flex gap-2 mt-3">
              {isPaymentCompleted ? (
                <>
                  <div className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg font-medium text-sm">
                    Payment Done
                  </div>
                  {onDownloadPaymentReceipt && (
                    <button
                      onClick={() => onDownloadPaymentReceipt(message.metadata)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Receipt PDF
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => onPaymentRequired && onPaymentRequired(message.metadata)}
                  className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                >
                  💳 Pay Now
                </button>
              )}
            </div>
          )}

          {appointmentStatus === 'completed' && currentUserRole === 'doctor' && appointmentId && (
            isPaymentCompleted ? (
              <div className="mt-2 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                Payment completed. You can now send prescription.
              </div>
            ) : (
              <div className="mt-2 text-xs text-green-700 bg-green-100 p-2 rounded">
                Appointment completed. Waiting for patient payment before sending prescription.
              </div>
            )
          )}

          {canPatientRespond && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onAppointmentAction(appointmentId, 'confirm')}
                disabled={appointmentActionLoadingId === appointmentId}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => onAppointmentAction(appointmentId, 'cancel')}
                disabled={appointmentActionLoadingId === appointmentId}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      );
    }

    return <p className="text-gray-800">{message.text}</p>;
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs px-4 py-2 rounded-lg ${
          isOwn
            ? 'bg-orange-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        {!isOwn && (
          <p className="text-xs font-semibold text-gray-600 mb-1">
            {message.senderId?.name || 'User'}
          </p>
        )}
        <div className="text-sm wrap-break-word">{renderMessageContent()}</div>
        <p
          className={`text-xs mt-1 ${
            isOwn ? 'text-orange-100' : 'text-gray-500'
          }`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
