import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Input,
  Label,
} from '../../../shared/components/ui';
import { forgotPasswordSchema } from '../schemas/auth.schema';
import { authApi } from '../services/auth.api';

export const ForgotPasswordCard: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldError(null);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setFieldError(validation.error.issues[0]?.message || 'Please provide a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword(validation.data.email);
      setSubmittedEmail(validation.data.email);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to send recovery link. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedEmail(null);
    setEmail('');
    setFieldError(null);
    setErrorMessage(null);
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
          <CardTitle className="text-2xl font-bold text-[#2B231D]">
            {submittedEmail ? 'Check your inbox' : 'Reset your password'}
          </CardTitle>
          <CardDescription className="text-sm text-[#756F68] mt-1">
            {submittedEmail
              ? 'Recovery instructions have been dispatched'
              : 'Enter the email address associated with your account, and we will send you a recovery link.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {submittedEmail ? (
            /* Quiet Confirmation State (In-place swap, no AI-slop badges) */
            <div className="space-y-6">
              <div className="rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] p-5 text-left">
                <p className="text-sm leading-relaxed text-[#2B231D]">
                  We have sent a password reset link to{' '}
                  <span className="font-semibold text-[#8A582B]">{submittedEmail}</span>.
                </p>
                <p className="text-xs text-[#756F68] mt-2 leading-normal">
                  If an account exists under this email, you will receive instructions within a few moments. For security, the link expires in 1 hour.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => navigate('/signin')}
                >
                  Return to sign in
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-[#756F68] hover:text-[#2B231D] underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Didn't receive the email? Try another address
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Default Form State */
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {errorMessage && (
                <Alert>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldError) setFieldError(null);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isLoading}
                  autoComplete="email"
                  error={!!fieldError}
                  autoFocus
                  required
                />
                {fieldError && (
                  <p className="text-xs text-[#9E2A2B] font-medium mt-1">
                    {fieldError}
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
                Send recovery link
              </Button>
            </form>
          )}
        </CardContent>

        {!submittedEmail && (
          <CardFooter className="justify-center border-t border-[#E8DFD3]/60 pt-4">
            <p className="text-xs text-[#756F68]">
              Remembered your password?{' '}
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
