import { jsPDF } from 'jspdf';

const PAGE_MARGIN = 14;
const CONTENT_WIDTH = 182;

const formatDateTime = (value) => {
  if (!value) return 'N/A';

  try {
    return new Date(value).toLocaleString();
  } catch {
    return 'N/A';
  }
};

const normalizeText = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  return String(value);
};

const ensureSpace = (doc, y, needed = 10) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - PAGE_MARGIN) {
    doc.addPage();
    return PAGE_MARGIN;
  }

  return y;
};

const addTitle = (doc, title, subtitle) => {
  let y = PAGE_MARGIN;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(234, 88, 12);
  doc.text(title, PAGE_MARGIN, y);
  y += 8;

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(subtitle, CONTENT_WIDTH);
    doc.text(lines, PAGE_MARGIN, y);
    y += lines.length * 5 + 3;
  }

  return y + 2;
};

const addSectionHeading = (doc, title, y) => {
  y = ensureSpace(doc, y, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(title, PAGE_MARGIN, y);
  return y + 7;
};

const addWrappedLine = (doc, text, y, color = [51, 65, 85]) => {
  y = ensureSpace(doc, y, 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(color[0], color[1], color[2]);

  const lines = doc.splitTextToSize(normalizeText(text), CONTENT_WIDTH);
  doc.text(lines, PAGE_MARGIN, y);
  return y + lines.length * 5 + 1;
};

const addKeyValue = (doc, label, value, y) => {
  return addWrappedLine(doc, `${label}: ${normalizeText(value)}`, y);
};

const addDivider = (doc, y) => {
  y = ensureSpace(doc, y, 6);
  doc.setDrawColor(226, 232, 240);
  doc.line(PAGE_MARGIN, y, PAGE_MARGIN + CONTENT_WIDTH, y);
  return y + 6;
};

const savePdf = (doc, filename) => {
  doc.save(filename);
};

export const downloadPrescriptionPdf = ({
  prescription,
  appointment,
  patientName,
  doctorName,
}) => {
  const doc = new jsPDF();
  let y = addTitle(
    doc,
    'MediTalk Prescription',
    'Official prescription summary generated from the consultation record.'
  );

  y = addSectionHeading(doc, 'Prescription Details', y);
  y = addKeyValue(doc, 'Prescription ID', prescription?._id, y);
  y = addKeyValue(doc, 'Appointment ID', prescription?.appointmentId || appointment?.appointmentId || appointment?._id, y);
  y = addKeyValue(doc, 'Doctor', prescription?.doctorId?.name || doctorName || 'N/A', y);
  y = addKeyValue(doc, 'Patient', prescription?.patientId?.name || patientName || 'N/A', y);
  y = addKeyValue(doc, 'Issued At', formatDateTime(prescription?.createdAt), y);
  y = addKeyValue(
    doc,
    'Consultation Time',
    formatDateTime(appointment?.proposedTime || appointment?.startTime),
    y
  );
  y = addKeyValue(doc, 'Status', prescription?.status, y);
  y = addDivider(doc, y);

  y = addSectionHeading(doc, 'Medicines', y);
  const medicines = Array.isArray(prescription?.medicines) ? prescription.medicines : [];

  if (medicines.length === 0) {
    y = addWrappedLine(doc, 'No medicines were recorded.', y);
  } else {
    medicines.forEach((medicine, index) => {
      y = ensureSpace(doc, y, 32);
      y = addWrappedLine(
        doc,
        `${index + 1}. ${medicine?.name || 'Medicine'} (${medicine?.type || 'tablet'})`,
        y,
        [37, 99, 235]
      );
      y = addKeyValue(doc, 'Dosage', medicine?.dosage, y);
      y = addKeyValue(doc, 'Frequency', medicine?.frequency, y);
      y = addKeyValue(doc, 'Duration', medicine?.duration, y);
      if (medicine?.instructions) {
        y = addKeyValue(doc, 'Instructions', medicine.instructions, y);
      }
      if (index < medicines.length - 1) {
        y = addDivider(doc, y);
      }
    });
  }

  if (prescription?.notes) {
    y = addDivider(doc, y);
    y = addSectionHeading(doc, 'Notes', y);
    y = addWrappedLine(doc, prescription.notes, y);
  }

  y = addDivider(doc, y);
  y = addWrappedLine(
    doc,
    'This prescription is for the named patient only and should be used together with the consultation instructions provided by the doctor.',
    y,
    [100, 116, 139]
  );

  savePdf(doc, `meditalk-prescription-${prescription?._id || 'document'}.pdf`);
};

export const downloadPaymentReceiptPdf = ({
  payment,
  appointment,
  patientName,
  doctorName,
}) => {
  const doc = new jsPDF();
  let y = addTitle(
    doc,
    'MediTalk Payment Receipt',
    'Payment confirmation generated from the consultation transaction record.'
  );

  y = addSectionHeading(doc, 'Transaction Details', y);
  y = addKeyValue(doc, 'Transaction ID', payment?.transactionId, y);
  y = addKeyValue(doc, 'Payment ID', payment?._id, y);
  y = addKeyValue(doc, 'Appointment ID', payment?.appointmentId || appointment?.appointmentId || appointment?._id, y);
  y = addKeyValue(doc, 'Doctor', payment?.doctorId?.name || doctorName || 'N/A', y);
  y = addKeyValue(doc, 'Patient', payment?.patientId?.name || patientName || 'N/A', y);
  y = addKeyValue(
    doc,
    'Consultation Time',
    formatDateTime(appointment?.proposedTime || appointment?.startTime),
    y
  );
  y = addKeyValue(doc, 'Payment Date', formatDateTime(payment?.updatedAt || payment?.createdAt), y);
  y = addKeyValue(doc, 'Amount', payment?.amount ? `$${payment.amount}` : 'N/A', y);
  y = addKeyValue(doc, 'Status', payment?.status, y);
  y = addKeyValue(doc, 'Card', payment?.cardLastFour ? `**** ${payment.cardLastFour}` : 'N/A', y);
  y = addDivider(doc, y);

  y = addWrappedLine(
    doc,
    'Keep this receipt for your records. The payment confirms the consultation was completed and the prescription can be issued or viewed from the consultation history.',
    y,
    [100, 116, 139]
  );

  savePdf(doc, `meditalk-payment-receipt-${payment?.transactionId || payment?._id || 'document'}.pdf`);
};