export const getDefaultRouteForRole = (role) => {
  if (role === 'admin') return '/admin-dashboard';
  if (role === 'doctor') return '/doctor-dashboard';
  return '/patient-home';
};

export const canUseMessaging = (role) => role === 'patient' || role === 'doctor';
