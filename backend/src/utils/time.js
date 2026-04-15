const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export const getJoinWindowBounds = (appointment) => {
  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return {
    joinFrom: start,
    joinUntil: new Date(end.getTime() + FIFTEEN_MINUTES_MS),
  };
};

export const canJoinMeeting = (appointment, now = new Date()) => {
  const bounds = getJoinWindowBounds(appointment);
  if (!bounds) {
    return { state: 'expired' };
  }

  if (now < bounds.joinFrom) {
    return { state: 'too_early', ...bounds };
  }

  if (now > bounds.joinUntil) {
    return { state: 'expired', ...bounds };
  }

  return { state: 'allowed', ...bounds };
};

export const isNoShowExpired = (appointment, now = new Date()) => {
  if (!appointment || appointment.status !== 'confirmed' || appointment.hasJoined) {
    return false;
  }

  const bounds = getJoinWindowBounds(appointment);
  if (!bounds) {
    return false;
  }

  return now > bounds.joinUntil;
};
