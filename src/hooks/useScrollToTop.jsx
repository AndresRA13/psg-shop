import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to scroll to top of page on route change
 * This ensures users always start at the top when navigating between pages
 */
const useScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top instantly when pathname changes
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default useScrollToTop;