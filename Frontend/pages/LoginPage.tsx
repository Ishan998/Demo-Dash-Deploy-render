import React, { useState, useEffect, useRef, KeyboardEvent, FormEvent } from "react";
import { sendOtp, verifyOtp, confirmPasswordReset, loginSuperUser } from "../services/apiService";
import ReCAPTCHA from "react-google-recaptcha";

const recaptchaSiteKey =
  (import.meta as any)?.env?.VITE_RECAPTCHA_SITE_KEY as string | undefined;
const DEBUG_CAPTCHA = ((import.meta as any)?.env?.VITE_DEBUG_CAPTCHA as string | undefined)?.toLowerCase?.() === "true";

type LoginView =
  | "login-email"
  | "login-otp"
  | "reset-request"
  | "reset-otp-verify"
  | "reset-set-new";

interface LoginPageProps {
  onLoginSuccess: () => void;
  onPasswordResetSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onPasswordResetSuccess }) => {
  const [view, setView] = useState<LoginView>("login-email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [resendTimer, setResendTimer] = useState(0);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Captcha + Attempts
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const recaptchaRef = useRef<any>(null);

  // Freeze countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (blockedUntil) {
      timer = setInterval(() => {
        const diff = Math.floor((new Date(blockedUntil).getTime() - Date.now()) / 1000);
        if (diff <= 0) {
          setBlockedUntil(null);
          setRemainingTime(null);
          clearInterval(timer);
        } else {
          setRemainingTime(diff);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [blockedUntil]);

  // Resend timer
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    if (resendTimer > 0) {
      timerId = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timerId);
  }, [resendTimer]);

  // Warn in console if captcha is required but site key is missing
  useEffect(() => {
    if (showCaptcha && !recaptchaSiteKey) {
      console.warn(
        "ReCAPTCHA site key missing. Set VITE_RECAPTCHA_SITE_KEY in .env.local."
      );
    }
  }, [showCaptcha]);

  // Debug: log important state transitions
  useEffect(() => {
    if (!DEBUG_CAPTCHA) return;
    console.debug("[CAPTCHA-DEBUG] env site key present:", !!recaptchaSiteKey);
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const switchView = (newView: LoginView) => {
    clearMessages();
    setView(newView);
    setPassword("");
    setOtp(new Array(6).fill(""));
    // reset captcha state when switching views
    setShowCaptcha(false);
    setCaptchaToken(null);
  };

  // ---- LOGIN ----
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (DEBUG_CAPTCHA) {
        console.debug("[CAPTCHA-DEBUG] handleLogin: showCaptcha=", showCaptcha, "token?", !!captchaToken);
      }
      await loginSuperUser(email, password, captchaToken || undefined);

      setShowCaptcha(false);
      setAttemptsLeft(null);
      setBlockedUntil(null);
      onLoginSuccess();
    } catch (err: any) {
      if (err.captchaRequired) {
        setShowCaptcha(true);
        // ensure a fresh challenge next attempt
        try { recaptchaRef.current?.reset?.(); } catch {}
        setCaptchaToken(null);
        if (DEBUG_CAPTCHA) console.debug("[CAPTCHA-DEBUG] captcha required by server");
      }
      if (typeof err.attempts === "number") setAttemptsLeft(Math.max(0, 3 - err.attempts));
      if (err.blockedUntil) {
        setBlockedUntil(new Date(err.blockedUntil));
        // Avoid duplicate UI messages: rely on the blocked banner
        setError(null);
      } else {
        setError(err.detail || "Login failed");
      }
      if (DEBUG_CAPTCHA) console.debug("[CAPTCHA-DEBUG] server error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ---- OTP LOGIN ----
  const handleOtpLoginRequest = async () => {
    clearMessages();
    setIsLoading(true);
    try {
      await sendOtp(email, "login");
      switchView("login-otp");
      setResendTimer(30);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async (e: FormEvent, isForReset: boolean) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    const enteredOtp = otp.join("");
    try {
      const data = await verifyOtp(email, enteredOtp, isForReset ? "reset" : "login");
      if (isForReset) {
        const rt = (data as any).reset_token || (data as any).resetToken;
        setResetToken(rt || null);
        switchView("reset-set-new");
      } else {
        if (data.access && data.refresh) {
          localStorage.setItem("accessToken", data.access);
          localStorage.setItem("refreshToken", data.refresh);
        }
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---- RESET PASSWORD ----
  const handlePasswordResetRequest = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      await sendOtp(email, "reset");
      switchView("reset-otp-verify");
      setResendTimer(30);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send reset code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      if (!resetToken) {
        setError("Reset token missing. Please verify OTP again.");
        setIsLoading(false);
        return;
      }
      await confirmPasswordReset(email, resetToken, newPassword);
      onPasswordResetSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to set new password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await sendOtp(email, view === "login-otp" ? "login" : "reset");
      setResendTimer(30);
      setSuccessMessage("A new OTP has been sent.");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to resend OTP.");
    }
  };

  // ---- VIEW RENDER ----
  const renderView = () => {
    switch (view) {
      case "login-email":
        return (
          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            error={error}
            successMessage={successMessage}
            isLoading={isLoading}
            handleLogin={handleLogin}
            onSwitchView={switchView}
            onOtpLoginRequest={handleOtpLoginRequest}
            showCaptcha={showCaptcha}
            captchaToken={captchaToken}
            setCaptchaToken={setCaptchaToken}
            attemptsLeft={attemptsLeft}
            blockedUntil={blockedUntil}
            remainingTime={remainingTime}
            recaptchaRef={recaptchaRef}
          />
        );
      case "login-otp":
        return (
          <OtpForm
            email={email}
            otp={otp}
            setOtp={setOtp}
            error={error}
            successMessage={successMessage}
            isLoading={isLoading}
            handleSubmit={(e) => handleOtpVerification(e, false)}
            onSwitchView={switchView}
            resendTimer={resendTimer}
            onResend={handleResendOtp}
            title="Sign in with OTP"
            buttonText="Sign In"
          />
        );
      case "reset-request":
        return (
          <ResetPasswordRequestForm
            email={email}
            setEmail={setEmail}
            error={error}
            isLoading={isLoading}
            handleSubmit={handlePasswordResetRequest}
            onSwitchView={switchView}
          />
        );
      case "reset-otp-verify":
        return (
          <OtpForm
            email={email}
            otp={otp}
            setOtp={setOtp}
            error={error}
            successMessage={successMessage}
            isLoading={isLoading}
            handleSubmit={(e) => handleOtpVerification(e, true)}
            onSwitchView={switchView}
            resendTimer={resendTimer}
            onResend={handleResendOtp}
            title="Verify Your Identity"
            buttonText="Verify"
          />
        );
      case "reset-set-new":
        return (
          <SetNewPasswordForm
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            error={error}
            isLoading={isLoading}
            handleSubmit={handleSetNewPassword}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 ml-2">Aura Jewels</h1>
        </div>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

// ---- COMPONENTS ----
const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const FormHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-6 text-center">
    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
    {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
  </div>
);

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  error,
  successMessage,
  isLoading,
  handleLogin,
  onSwitchView,
  onOtpLoginRequest,
  showCaptcha,
  captchaToken,
  setCaptchaToken,
  attemptsLeft,
  blockedUntil,
  remainingTime,
  recaptchaRef,
}: any) => (
  <>
    <FormHeader title="Sign in to your account" />
    {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
    {successMessage && (
      <p className="text-green-600 text-sm text-center mb-4 bg-green-50 p-3 rounded-md">
        {successMessage}
      </p>
    )}

    {attemptsLeft !== null && attemptsLeft >= 0 && !blockedUntil && (
      <p className="text-yellow-600 text-sm text-center mb-2">
        ⚠️ {attemptsLeft} attempts left before captcha required
      </p>
    )}

    {blockedUntil && remainingTime !== null && (
      <p className="text-red-600 text-sm text-center mb-2">
        🚫 Too many attempts. Try again in {Math.floor(remainingTime / 60)}m {remainingTime % 60}s
      </p>
    )}

    {showCaptcha && recaptchaSiteKey && (
      <div className="my-3 flex justify-center">
        <ReCAPTCHA
          ref={recaptchaRef as any}
          sitekey={recaptchaSiteKey}
          onChange={(token) => {
            if (DEBUG_CAPTCHA) console.debug("[CAPTCHA-DEBUG] onChange token present:", !!token);
            setCaptchaToken(token);
          }}
        />
      </div>
    )}
    

    {/* Do not render developer/setup details to users */}

    {DEBUG_CAPTCHA && (
      <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded" data-captcha-debug>
        <div>[DEBUG] reCAPTCHA env key present: {String(!!recaptchaSiteKey)}</div>
        <div>[DEBUG] showCaptcha: {String(!!showCaptcha)}</div>
        <div>[DEBUG] token present: {String(!!captchaToken)}</div>
        <div>[DEBUG] attemptsLeft: {attemptsLeft === null ? "n/a" : attemptsLeft}</div>
        <div>[DEBUG] blockedUntil: {blockedUntil ? blockedUntil.toISOString() : "n/a"}</div>
        <div>[DEBUG] remainingTime: {remainingTime ?? "n/a"}</div>
      </div>
    )}

    <form className="space-y-6" onSubmit={handleLogin}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
      </div>
      <div className="flex items-center justify-end">
        <div className="text-sm">
          <button
            type="button"
            onClick={() => onSwitchView("reset-request")}
            className="font-medium text-primary hover:text-opacity-80"
          >
            Forgot your password?
          </button>
        </div>
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading || (showCaptcha && recaptchaSiteKey && !captchaToken)}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isLoading && <Spinner />} Sign in
        </button>
      </div>
      <div>
        <button
          type="button"
          onClick={onOtpLoginRequest}
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          Sign in with OTP
        </button>
      </div>
    </form>
  </>
);

const OtpForm = ({
  email,
  otp,
  setOtp,
  error,
  successMessage,
  isLoading,
  handleSubmit,
  onSwitchView,
  resendTimer,
  onResend,
  title,
  buttonText,
}: any) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    const newOtp = [...otp];
    newOtp[index] = element.value[element.value.length - 1] || "";
    setOtp(newOtp);
    if (element.value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <>
      <FormHeader title={title} subtitle={`An OTP has been sent to ${email}`} />
      {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
      {successMessage && (
        <p className="text-green-600 text-sm text-center mb-4">{successMessage}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="flex justify-center space-x-2 mb-6">
          {otp.map((data: string, index: number) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              maxLength={1}
              value={data}
              onChange={(e) => handleOtpChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={(e) => e.target.select()}
              className="w-12 h-14 text-center text-2xl font-semibold border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            />
          ))}
        </div>
        <div className="text-center text-sm mb-6">
          {resendTimer > 0 ? (
            <p className="text-gray-500">Resend OTP in {resendTimer}s</p>
          ) : (
            <button
              type="button"
              onClick={onResend}
              className="font-medium text-primary hover:text-opacity-80"
            >
              Resend OTP
            </button>
          )}
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading || otp.join("").length !== 6}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isLoading && <Spinner />} {buttonText}
          </button>
        </div>
      </form>
      <div className="text-center text-sm mt-4">
        <button
          type="button"
          onClick={() => onSwitchView("login-email")}
          className="font-medium text-primary hover:text-opacity-80"
        >
          Back to login
        </button>
      </div>
    </>
  );
};

const ResetPasswordRequestForm = ({
  email,
  setEmail,
  error,
  isLoading,
  handleSubmit,
  onSwitchView,
}: any) => (
  <>
    <FormHeader title="Reset Password" subtitle="Enter your email to receive a verification code." />
    {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isLoading && <Spinner />} Send Code
        </button>
      </div>
    </form>
    <div className="text-center text-sm mt-4">
      <button
        type="button"
        onClick={() => onSwitchView("login-email")}
        className="font-medium text-primary hover:text-opacity-80"
      >
        Back to login
      </button>
    </div>
  </>
);

const SetNewPasswordForm = ({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  error,
  isLoading,
  handleSubmit,
}: any) => (
  <>
    <FormHeader
      title="Set New Password"
      subtitle="Your new password must be at least 8 characters long."
    />
    {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
          New Password
        </label>
        <div className="mt-1">
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm New Password
        </label>
        <div className="mt-1">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isLoading && <Spinner />} Set New Password and Sign In
        </button>
      </div>
    </form>
  </>
);

export default LoginPage;
