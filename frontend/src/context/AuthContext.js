import { createContext } from 'react';

export const AuthContext = createContext({
  session: null,
  user: null,
  profile: null,
  role: '',
  isAdmin: false,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  refreshRole: async () => {},
});
