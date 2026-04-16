import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';
import { downloadPaymentReceiptPdf } from '../utils/documentPdf.js';

export default function PaymentModal({ appointment, onClose, onPaymentSuccess }) {
  const [step, setStep] = useState('details'); // details, payment, receipt
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [error, setError] = useState('');

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    }

    // Format expiry date
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length === 2) {
        formattedValue = formattedValue + '/';
      } else if (formattedValue.length > 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
    }

    // Limit CVV to 3-4 digits
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setCardDetails((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const initiatePayment = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await paymentService.initiatePayment(
        appointment._id,
        500 // Mock payment amount
      );
      setPaymentId(response.data.paymentId);
      setStep('payment');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    // Validation
    if (
      !cardDetails.cardNumber ||
      !cardDetails.cardName ||
      !cardDetails.expiryDate ||
      !cardDetails.cvv
    ) {
      setError('Please fill in all card details');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await paymentService.processPayment(paymentId, {
        cardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
        expiryDate: cardDetails.expiryDate,
        cvv: cardDetails.cvv,
      });
      setPaymentReceipt(response.data);
      setStep('receipt');
      
      // Call success callback
      if (onPaymentSuccess) {
        onPaymentSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Step 1: Payment Details */}
        {step === 'details' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Payment</h2>
            
            <div className="bg-orange-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Consultation Fee</p>
              <p className="text-3xl font-bold text-orange-600">$500</p>
            </div>

            <p className="text-gray-600 mb-6">
              After payment, your doctor will send you the prescription with medication details and usage instructions.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={initiatePayment}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Card Details */}
        {step === 'payment' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Enter Card Details</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={cardDetails.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Card Holder Name
                </label>
                <input
                  type="text"
                  name="cardName"
                  value={cardDetails.cardName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={cardDetails.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    maxLength="5"
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={cardDetails.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength="4"
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep('details')}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={processPayment}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : 'Pay $500'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Receipt */}
        {step === 'receipt' && paymentReceipt && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold text-gray-900">${paymentReceipt.receipt.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-semibold text-gray-900 text-sm">
                  {paymentReceipt.receipt.transactionId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Card</span>
                <span className="font-semibold text-gray-900">
                  **** {paymentReceipt.receipt.cardLastFour}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-semibold text-gray-900">
                  {new Date(paymentReceipt.receipt.date).toLocaleDateString()}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6 text-center">
              Your doctor will send the prescription shortly. Check your chat for updates.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() =>
                  downloadPaymentReceiptPdf({
                    payment: {
                      _id: paymentReceipt.paymentId,
                      transactionId: paymentReceipt.receipt.transactionId,
                      amount: paymentReceipt.receipt.amount,
                      status: paymentReceipt.status,
                      cardLastFour: paymentReceipt.receipt.cardLastFour,
                      updatedAt: paymentReceipt.receipt.date,
                    },
                    appointment,
                    patientName: appointment?.patientId?.name,
                    doctorName: appointment?.doctorId?.name,
                  })
                }
                className="w-full px-4 py-3 border border-blue-200 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
