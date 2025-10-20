'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import AuthModal from './AuthModal';
import { useAuth } from './AuthContext';

const AuthModalBoundary = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    openAuthModal,
    initialized,
  } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !initialized) {
    return null;
  }

  return createPortal(
    <AuthModal
      open={isAuthModalOpen}
      mode={authModalMode}
      onClose={closeAuthModal}
      onSwitchMode={openAuthModal}
    />,
    document.body
  );
};

export default AuthModalBoundary;

