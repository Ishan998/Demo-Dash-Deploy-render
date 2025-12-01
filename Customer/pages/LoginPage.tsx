import React, { useState } from 'react';
import { GoogleIcon } from '../components/Icon';
// import { signInWithGoogle } from '../services/apiService';
import type { User } from '../types';
import { loginCustomer } from '../services/apiService';

interface LoginPageProps {
    onLoginSuccess: (user?: User | null) => void;
    onNavigateToForgotPassword: () => void;
    onNavigateToSignUp: () => void;
    promptMessage?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateToForgotPassword, onNavigateToSignUp, promptMessage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        try {
            const res = await loginCustomer(email, password);
            onLoginSuccess((res as any).customer);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid credentials.');
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        setError('');
        try {
            const googleUser = await signInWithGoogle();
            onLoginSuccess(googleUser);
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google.');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <main className="py-16 sm:py-24 p-4">
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">Welcome Back!</h1>
                    <p className="text-center text-gray-500 mb-6">Login to your account</p>

                    {promptMessage && (
                        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 text-sm">
                            <p>{promptMessage}</p>
                        </div>
                    )}
                    
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37] sm:text-sm"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password</label>
                                <div className="text-sm">
                                    <button type="button" onClick={onNavigateToForgotPassword} className="font-medium text-[#D4AF37] hover:text-amber-600">
                                        Forgot password?
                                    </button>
                                </div>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37] sm:text-sm"
                            />
                        </div>
                        
                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <div>
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
                                Login
                            </button>
                        </div>
                    </form>

                    <div className="my-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">OR</span>
                            </div>
                        </div>
                    </div>

                    <div>
                         <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading}
                            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-wait"
                        >
                            {isGoogleLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <GoogleIcon className="w-5 h-5 mr-2" />
                                    Continue with Google
                                </>
                            )}
                        </button>
                    </div>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <button type="button" onClick={onNavigateToSignUp} className="font-medium text-[#D4AF37] hover:text-amber-600">
                            Sign up
                        </button>
                    </p>
                </div>
                 <p className="mt-4 text-center text-xs text-gray-500">
                    Having trouble?{' '}
                    <a href="#" className="underline hover:text-gray-700">Contact Support</a>
                </p>
            </div>
        </main>
    );
};

export default LoginPage;
