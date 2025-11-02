import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, isVisible: true });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return { toast, showToast, hideToast };
};
