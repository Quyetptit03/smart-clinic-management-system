"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register(username, password);
      toast.success('Account created successfully');
      router.push('/dashboard');
    } catch (error: any) {
      const msg = error?.response?.data || error?.message || 'Registration failed';
      toast.error(typeof msg === 'string' ? msg : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-700 p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

      <Card className="w-full max-w-md relative z-10 p-8 py-10 rounded-3xl shadow-2xl bg-white/95 backdrop-blur-xl border border-white/40 overflow-hidden">
        <div className="text-center mb-8 relative">
          <div className="mx-auto w-16 h-16 bg-cyan-50 rounded-2xl flex items-center justify-center mb-5 text-3xl shadow-inner border border-cyan-100 rotate-3 transform hover:rotate-12 transition-transform">
            ✍️
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">
            Register a new account to access the clinic system.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5 animate-fade-in">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 shadow-sm bg-gray-50/50"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 shadow-sm bg-gray-50/50"
              placeholder="Create a password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 shadow-sm bg-gray-50/50"
              placeholder="Repeat your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 mt-6 text-[15px] font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:shadow-none"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-gray-500 pt-2">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-cyan-700 hover:text-cyan-600 transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </Card>

      <div className="absolute bottom-6 text-center text-sm font-medium text-white/70 z-10 w-full drop-shadow-sm">
        &copy; {new Date().getFullYear()} EMR System. Secure Access Portal.
      </div>
    </div>
  );
}