import React, { createContext, useContext } from 'react';

// Create AuthContext
export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;