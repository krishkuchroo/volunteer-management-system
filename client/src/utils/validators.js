export const passwordRules = {
  required: 'Password is required',
  minLength: { value: 8, message: 'Password must be at least 8 characters' },
  pattern: {
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    message: 'Must include uppercase, lowercase, number, and special character',
  },
};

export const emailRules = {
  required: 'Email is required',
  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email is required' },
};

export const nameRules = {
  required: 'This field is required',
  minLength: { value: 2, message: 'Must be at least 2 characters' },
  maxLength: { value: 100, message: 'Must be 100 characters or fewer' },
};
