import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    createdVia: {
      type: String,
      enum: ['chat', 'manual'],
      default: 'chat',
    },
    notes: {
      type: String,
      default: '',
    },
    meetingLink: {
      type: String,
      default: '',
    },
    hasJoined: {
      type: Boolean,
      default: false,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
    isMeetingCompleted: {
      type: Boolean,
      default: false,
    },
    endedBy: {
      type: String,
      enum: ['doctor', 'patient', null],
      default: null,
    },
    cancellationReason: {
      type: String,
      enum: ['manual', 'no_show', null],
      default: null,
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, startTime: 1, endTime: 1 });
appointmentSchema.index({ patientId: 1, startTime: -1 });

export default mongoose.model('Appointment', appointmentSchema);
