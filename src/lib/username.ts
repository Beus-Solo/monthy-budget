const USERNAME_DOMAIN = 'household.local';

export const usernameToEmail = (username: string) => {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `${clean}@${USERNAME_DOMAIN}`;
};

export const isUsernameEmail = (email: string) => email.toLowerCase().endsWith(`@${USERNAME_DOMAIN}`);

export const emailToUsername = (email: string) => email.split('@')[0];
