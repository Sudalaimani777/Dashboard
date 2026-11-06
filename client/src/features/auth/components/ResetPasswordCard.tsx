import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Label,
  PasswordInput,
} from '../../../shared/components/ui';
import { resetPasswordSchema } from '../schemas/auth.schema';
import { authApi } from '../services/auth.api';

export const ResetPasswordCard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  // Missing or empty token URL Guard
  const isMissingToken = !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      const errors: { password?: string; confirmPassword?: string } = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as 'password' | 'confirmPassword';
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, validation.data.password);
      setIsSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password.';
      // Check if the backend reported an expired/invalid token
      if (
        msg.toLowerCase().includes('expired') ||
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('token')
      ) {
        setIsTokenExpired(true);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
    if (errorMessage) setErrorMessage(null);
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (fieldErrors.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
    if (errorMessage) setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE] px-4 py-12">
      <Card className="w-full max-w-md bg-[#FFFFFF] border-[#E8DFD3] shadow-md shadow-[#8A582B]/5 rounded-2xl">
        <CardHeader className="text-center pb-6">
          <Link
            to="/"
            className="inline-block mb-3 text-sm font-semibold tracking-wide text-[#8A582B] hover:text-[#754820] transition-colors"
          >
            Readventure
          </Link>

          {isMissingToken ? (
            <>
              <CardTitle className="text-2xl font-bold text-[#2B231D]">
                Reset link missing or invalid
              </CardTitle>
              <CardDescription className="text-sm text-[#756F68] mt-1">
                This password reset link is invalid or incomplete.
              </CardDescription>
            </>
          ) : isTokenExpired ? (
            <>
              <CardTitle className="text-2xl font-bold text-[#2B231D]">
                Reset link expired
              </CardTitle>
              <CardDescription className="text-sm text-[#756F68] mt-1">
                This recovery link has expired or has already been used.
              </CardDescription>
            </>
          ) : isSuccess ? (
            <>
              <CardTitle className="text-2xl font-bold text-[#2B231D]">
                Password updated
              </CardTitle>
              <CardDescription className="text-sm text-[#756F68] mt-1">
                Your credentials have been securely updated.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl font-bold text-[#2B231D]">
                Set new password
              </CardTitle>
              <CardDescription className="text-sm text-[#756F68] mt-1">
                Enter your new password below. It must be at least 8 characters.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {isMissingToken ? (
            /* Guard State: Missing Token */
            <div className="space-y-6">
              <div className="rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] p-5 text-left">
                <p className="text-sm text-[#2B231D] leading-relaxed">
                  No recovery token was detected in the URL. If you copied this link from an email, ensure the entire URL was pasted into your browser bar.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => navigate('/forgot-password')}
              >
                Request a new link
              </Button>
            </div>
          ) : isTokenExpired ? (
            /* Expired / Consumed Token State */
            <div className="space-y-6">
              <div className="rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] p-5 text-left">
                <p className="text-sm text-[#2B231D] leading-relaxed">
                  Password reset links are valid for one hour and can only be used once. Please request a fresh link to reset your password.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => navigate('/forgot-password')}
              >
                Request a new link
              </Button>
            </div>
          ) : isSuccess ? (
            /* Success State */
            <div className="space-y-6">
              <div className="rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] p-5 text-left">
                <p className="text-sm text-[#2B231D] leading-relaxed">
                  Your password has been changed. You can now sign in to your Readventure library with your new password.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => navigate('/signin')}
              >
                Sign in to Readventure
              </Button>
            </div>
          ) : (
            /* Active Form State */
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {errorMessage && (
                <Alert>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  error={!!fieldErrors.password}
                  autoFocus
                  required
                />
                {fieldErrors.password ? (
                  <p className="text-xs text-[#9E2A2B] font-medium mt-1">
                    {fieldErrors.password}
                  </p>
                ) : (
                  <p className="text-xs text-[#756F68] mt-1">
                    Minimum 8 characters.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  error={!!fieldErrors.confirmPassword}
                  required
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-[#9E2A2B] font-medium mt-1">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Update password
              </Button>
            </form>
          )}
        </CardContent>

        {!isSuccess && !isMissingToken && !isTokenExpired && (
          <CardFooter className="justify-center border-t border-[#E8DFD3]/60 pt-4">
            <p className="text-xs text-[#756F68]">
              Remembered your credentials?{' '}
              <Link
                to="/signin"
                className="font-semibold text-[#8A582B] hover:text-[#754820] cursor-pointer"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
