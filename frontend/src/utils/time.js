const WINDOW_MINUTES = 15;
const WINDOW_MS = WINDOW_MINUTES * 60 * 1000;

const toValidDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatMinutes = (minutes) => {
  if (minutes <= 1) return '1 minute';
  return `${minutes} minutes`;
};

export const getMeetingJoinState = (appointment) => {
  if (!appointment || appointment.status !== 'confirmed') {
    return 'not_confirmed';
  }

  const startTime = toValidDate(appointment.startTime || appointment.proposedTime);
  const endTime = toValidDate(appointment.endTime);
  if (!startTime || !endTime) {
    return 'expired';
  }

  const now = new Date();
  const joinFrom = startTime;
  const joinUntil = new Date(endTime.getTime() + WINDOW_MS);

  if (now < joinFrom) return 'too_early';
  if (now > joinUntil) return 'expired';
  return 'allowed';
};

export const canJoinAppointment = (appointment) => getMeetingJoinState(appointment) === 'allowed';

export const getJoinStatusText = (appointment) => {
  const state = getMeetingJoinState(appointment);
  if (state === 'too_early') {
    const startTime = toValidDate(appointment.startTime || appointment.proposedTime);
    if (!startTime) return 'Too early to join';
    const minutes = Math.ceil((startTime.getTime() - Date.now()) / 60000);
    return minutes > 0 ? `Meeting starts in ${formatMinutes(minutes)}` : 'Too early to join';
  }

  if (state === 'expired') {
    return 'Meeting expired';
  }

  if (appointment?.status === 'completed') {
    return 'Completed';
  }

  return '';
};
