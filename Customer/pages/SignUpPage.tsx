import React, { useState, useRef, useEffect } from 'react';
import { GemIcon, InformationCircleIcon } from '../components/Icon';
import { registerCustomer, sendSignupOtp, verifySignupOtp } from '../services/apiService';

interface SignUpPageProps {
  onNavigateToLogin: () => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigateToLogin }) => {
  type Step = 'details' | 'otp' | 'success';
  const [step, setStep] = useState<Step>('details');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpInputsRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (step === 'otp' && otpInputsRef.current[0]) {
      otpInputsRef.current[0].focus();
    }
  }, [step]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (Object.values(formData).some(value => typeof value === 'string' && value.trim() === '')) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }
    if (!formData.email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    if (!formData.phone.match(/^\d{10}$/)) {
      setError('Please enter a valid 10-digit phone number.');
      setLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    if (!formData.pincode.match(/^\d{6}$/)) {
      setError('Please enter a valid 6-digit pincode.');
      setLoading(false);
      return;
    }

    try {
      await sendSignupOtp(formData.email);
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Could not send verification code. Please try again.');
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

    if (value && index < 5 && otpInputsRef.current[index + 1]) {
        otpInputsRef.current[index + 1].focus();
    }
  };
  
  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && otpInputsRef.current[index - 1]) {
        otpInputsRef.current[index - 1].focus();
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
      const res = await verifySignupOtp(formData.email, enteredOtp);
      const token = res?.signup_token || res?.signupToken;
      if (!token) {
        setError('Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }
      await registerCustomer(
        formData.fullName,
        formData.email,
        formData.phone,
        formData.password,
        token
      );
      setStep('success');
      setTimeout(() => {
        onNavigateToLogin();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
    
  const renderStep = () => {
    switch (step) {
      case 'details':
        return (
            <>
                <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">Create an Account</h1>
                <p className="text-center text-gray-500 mb-6 text-sm">Join the Blessing Ornaments family</p>
                <form onSubmit={handleDetailsSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input id="fullName" type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required placeholder="e.g., Priya Sharma" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input id="email" type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="you@example.com" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]" />
                        </div>
                         <div>
                            <div className="flex items-center space-x-1">
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <div className="relative group">
                                    <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs hidden group-hover:block bg-black text-white text-xs rounded py-1.5 px-3 z-10 shadow-lg" style={{ pointerEvents: 'none' }}>
                                        Enter a valid 10-digit mobile number.
                                        <svg className="absolute text-black h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                                    </div>
                                </div>
                            </div>
                            <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="e.g., 9876543210" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-1">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                <div className="relative group">
                                    <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs hidden group-hover:block bg-black text-white text-xs rounded py-1.5 px-3 z-10 shadow-lg" style={{ pointerEvents: 'none' }}>
                                        Must be at least 8 characters long.
                                        <svg className="absolute text-black h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                                    </div>
                                </div>
                            </div>
                            <input id="password" type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder="Minimum 8 characters" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]" />
                        </div>
                         <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Re-enter Password</label>
                            <input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required placeholder="Confirm your password" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]" />
                        </div>
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                            <input id="city" type="text" name="city" value={formData.city} onChange={handleInputChange} required placeholder="e.g., Mumbai" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]" />
                        </div>
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                            <input id="state" type="text" name="state" value={formData.state} onChange={handleInputChange} required placeholder="e.g., Maharashtra" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-1">
                                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">Pincode</label>
                                <div className="relative group">
                                    <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs hidden group-hover:block bg-black text-white text-xs rounded py-1.5 px-3 z-10 shadow-lg" style={{ pointerEvents: 'none' }}>
                                        Enter a valid 6-digit pincode.
                                        <svg className="absolute text-black h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                                    </div>
                                </div>
                            </div>
                            <input id="pincode" type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} required placeholder="e.g., 400001" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]" />
                        </div>
                    </div>
                    
                    {error && <p className="text-sm text-red-600 text-center col-span-2 pt-2">{error}</p>}
                    
                    <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 mt-4 disabled:opacity-60">
                        {loading ? 'Sending OTP...' : 'Create Account & Verify'}
                    </button>
                </form>
            </>
        );
      case 'otp':
        return (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
                <h1 className="text-2xl font-bold text-center text-gray-800">Verify Your Email</h1>
                <p className="text-center text-gray-500 text-sm">A 6-digit code has been sent to <strong>{formData.email}</strong>.</p>
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
                <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 disabled:opacity-60">
                    {loading ? 'Verifying...' : 'Verify & Create Account'}
                </button>
                <p className="text-center text-sm text-gray-500">Didn't receive code? <button type="button" disabled={loading} onClick={handleDetailsSubmit as any} className="font-medium text-[#D4AF37] hover:underline disabled:opacity-60">Resend</button></p>
            </form>
        );
      case 'success':
        return (
            <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold text-green-600">Account Created!</h1>
                <p className="text-gray-600">Welcome to Blessing Ornaments! You have been successfully registered.</p>
                <p className="text-sm text-gray-500">Redirecting you to login...</p>
                <button onClick={onNavigateToLogin} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900">
                    Go to Login
                </button>
            </div>
        );
    }
  };

  return (
    <main className="py-16 sm:py-24 p-4">
      <div className="w-full max-w-lg mx-auto">
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

export default SignUpPage;
