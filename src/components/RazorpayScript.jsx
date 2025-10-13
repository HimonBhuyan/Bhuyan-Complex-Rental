import { useEffect } from 'react';

const RazorpayScript = () => {
  useEffect(() => {
    // Check if Razorpay script is already loaded
    if (window.Razorpay) {
      return;
    }

    // Create and append Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Razorpay script loaded successfully');
    };
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script');
    };

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Remove script if component unmounts
      const existingScript = document.head.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default RazorpayScript;