import { useEffect } from 'react';

/**
 * Custom hook to scroll to modal when it opens
 * @param {boolean} isOpen - Whether the modal is open
 * @param {React.RefObject} modalRef - Reference to the modal element
 */
export const useModalScroll = (isOpen, modalRef) => {
  useEffect(() => {
    if (isOpen && modalRef?.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        modalRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [isOpen, modalRef]);
};
