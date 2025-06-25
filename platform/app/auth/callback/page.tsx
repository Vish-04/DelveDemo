'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabase/client';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/?error=auth_callback_failed');
          return;
        }

        if (data.session) {
          console.log('Auth callback successful, redirecting to home');
          router.push('/');
        } else {
          console.log('No session found, redirecting to home');
          router.push('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/?error=auth_callback_failed');
      }
    };

    // Handle the auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change in callback:', event, !!session);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        router.push('/');
      } else if (event === 'SIGNED_OUT') {
        router.push('/');
      }
    });

    // Also handle immediately
    handleAuthCallback();

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
} 