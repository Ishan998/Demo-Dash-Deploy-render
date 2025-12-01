

import React, { useState, useRef, useEffect } from 'react';
import { GemIcon, InformationCircleIcon } from '../components/Icon';
import { sendResetOtp, verifyResetOtp, confirmPasswordReset } from '../services/apiService';

interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigateToLogin }) => {
    type Step = 'email' | 'otp' | 'reset' | 'success';
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetToken, setResetToken] = useState<string | null>(null);
    
    const otpInputsRef = useRef<HTMLInputElement[]>([]);

    useEffect(() => {
        if (step === 'otp') {
            otpInputsRef.current[0]?.focus();
        }
    }, [step]);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        if (!email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
            setError('Please enter a valid email address.');
            setLoading(false);
            return;
        }
        try {
            await sendResetOtp(email);
            setStep('otp');
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Could not send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const { value } = e.target;
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpInputsRef.current[index + 1]?.focus();
        }
    };
    
    const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputsRef.current[index - 1]?.focus();
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const enteredOtp = otp.join('');
        if (enteredOtp.length !== 6) {
            setError('Please enter the complete 6-digit code.');
            setLoading(false);
            return;
        }
        try {
            const res = await verifyResetOtp(email, enteredOtp);
            const token = res?.reset_token || res?.resetToken;
            if (!token) {
                setError('Invalid OTP. Please try again.');
            } else {
                setResetToken(token);
                setStep('reset');
            }
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            setLoading(false);
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }
        try {
            if (!resetToken) {
                setError('OTP verification required.');
                return;
            }
            await confirmPasswordReset(email, resetToken, newPassword);
            setStep('success');
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Password reset failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    const renderStep = () => {
        switch (step) {
            case 'email':
                return (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <h1 className="text-2xl font-bold text-center text-gray-800">Forgot Password</h1>
                        <p className="text-center text-gray-500 text-sm">Enter your email to receive a verification code.</p>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37] sm:text-sm"
                            />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button type="submit" className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900">
                            {loading ? 'Sending...' : 'Send Code'}
                        </button>
                    </form>
                );
            case 'otp':
                return (
                     <form onSubmit={handleOtpSubmit} className="space-y-4">
                        <h1 className="text-2xl font-bold text-center text-gray-800">Verify Your Email</h1>
                        <p className="text-center text-gray-500 text-sm">A 6-digit code has been sent to <strong>{email}</strong>.</p>
                        <div className="flex justify-center gap-2">
                           {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    value={data}
                                    maxLength={1}
                                    onChange={(e) => handleOtpChange(e, index)}
                                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                    ref={el => { if (el) otpInputsRef.current[index] = el; }}
                                    className="w-12 h-12 text-center text-2xl bg-white border border-gray-300 rounded-md focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                />
                           ))}
                        </div>
                         {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                         <button type="submit" className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900">
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                         <p className="text-center text-sm text-gray-500">Didn't receive code? <button type="button" disabled={loading} onClick={handleEmailSubmit as any} className="font-medium text-[#D4AF37] hover:underline disabled:opacity-60">Resend</button></p>
                    </form>
                );
            case 'reset':
                return (
                    <form onSubmit={handleResetSubmit} className="space-y-4">
                        <h1 className="text-2xl font-bold text-center text-gray-800">Set New Password</h1>
                        <p className="text-center text-gray-500 text-sm">Your new password must be at least 8 characters long.</p>
                        <div>
                            <div className="flex items-center space-x-1">
                                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
                                <div className="relative group">
                                    <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs hidden group-hover:block bg-black text-white text-xs rounded py-1.5 px-3 z-10 shadow-lg"
                                        style={{ pointerEvents: 'none' }}>
                                        Password must be at least 8 characters long.
                                        <svg className="absolute text-black h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                                    </div>
                                </div>
                            </div>
                            <input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Minimum 8 characters" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37] sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                            <input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Re-enter your password" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37] sm:text-sm" />
                        </div>
                         {error && <p className="text-sm text-red-600">{error}</p>}
                        <button type="submit" className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900">
                            {loading ? 'Saving...' : 'Reset Password'}
                        </button>
                    </form>
                );
            case 'success':
                 return (
                    <div className="text-center space-y-4">
                         <h1 className="text-2xl font-bold text-gray-800">Password Reset!</h1>
                        <p className="text-gray-500">Your password has been successfully reset. You can now log in with your new password.</p>
                        <button onClick={onNavigateToLogin} className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900">
                            Back to Login
                        </button>
                    </div>
                 );
        }
    };

    return (
        <main className="py-16 sm:py-24 p-4">
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                   {renderStep()}
                    {step !== 'success' && (
                        <p className="mt-6 text-center text-sm">
                            <button onClick={onNavigateToLogin} className="font-medium text-gray-600 hover:text-gray-900">
                                &larr; Back to Login
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
};

export default ForgotPasswordPage;
