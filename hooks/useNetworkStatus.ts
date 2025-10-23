import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    isSlowConnection: false,
    effectiveType: '4g',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check initial network status
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

      const effectiveType = connection?.effectiveType || '4g';
      const isSlowConnection = effectiveType === '2g' || effectiveType === 'slow-2g' || effectiveType === '3g';

      setNetworkStatus({
        isOnline,
        isSlowConnection,
        effectiveType: effectiveType as any,
      });
    };

    // Initial check
    updateNetworkStatus();

    // Listen to online/offline events
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Listen to connection change
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
};
