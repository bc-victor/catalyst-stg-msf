'use client';

import { useRouter } from 'next/compat/router';
import { useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

const useSDK = () => {
  const [sdk, setSdk] = useState<NonNullable<typeof window.b2b> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.b2b?.utils) {
        setSdk(window.b2b);
        clearInterval(interval);
        console.log('B2B SDK loaded', window.b2b);
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return sdk;
};

const handleLogout = () => {
  console.log('trying to sign out');
  void signOut({
    redirect: true,
    redirectTo: '/login',
  }).catch((error: unknown) => {
    console.error('Failed to sign out:', error);
  });
};

const sections: Record<string, string> = {
  register: 'REGISTER_ACCOUNT',
  orders: 'ORDERS',
  login: 'SIGN_IN',
};

export function useB2BAuth(token?: string) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sdk = useSDK();

  useEffect(() => {
    sdk?.callbacks?.addEventListener('on-logout', handleLogout);

    return () => {
      sdk?.callbacks?.removeEventListener('on-logout', handleLogout);
    };
  }, [sdk]);

  useEffect(() => {
    console.log('check');

    const params = new URLSearchParams(searchParams);
    const section = params.get('section');

    if (!section || !sdk) {
      return;
    }

    if (sections[section]) {
      params.delete('section');
      window.history.replaceState({}, '', `${window.location.pathname}${params}`);
      sdk.utils?.openPage(sections[section]);
    }
  }, [searchParams, sdk, router]);

  useEffect(() => {
    if (sdk && token && token !== sdk.utils?.user.getB2BToken()) {
      void sdk.utils?.user.loginWithB2BStorefrontToken(token);
      console.log('login with token', token);
    }
  }, [sdk, token]);

  return null;
}
