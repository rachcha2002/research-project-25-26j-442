import React from 'react';

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_AUTH_URL}/doctors/google`;

export default function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg py-2 px-4 shadow hover:bg-gray-100 transition-colors"
    >
      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
      <span className="text-gray-700 font-medium">Sign in with Google</span>
    </button>
  );
}