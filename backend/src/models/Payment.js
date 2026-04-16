import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    // Mock payment details (no real processing)
    cardLastFour: {
      type: String,
      default: '',
    },
    transactionId: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card'],
      default: 'credit_card',
    },
  },
  { timestamps: true }
);

// Index for efficient queries
paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ patientId: 1, createdAt: -1 });
paymentSchema.index({ doctorId: 1, createdAt: -1 });

export default mongoose.model('Payment', paymentSchema);
