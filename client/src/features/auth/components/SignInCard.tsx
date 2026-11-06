import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  PasswordInput,
} from '../../../shared/components/ui';
import { useAuth } from '../hooks/useAuth';
import { signInSchema } from '../schemas/auth.schema';

export const SignInCard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signin, isAuthenticated, isAuthenticating, authError, clearAuthError } = useAuth();

  const registeredEmail = (location.state as { registeredEmail?: string } | undefined)?.registeredEmail;
  const initialSuccessMessage = (location.state as { successMessage?: string } | undefined)?.successMessage;

  const [email, setEmail] = useState(registeredEmail || '');
  const [password, setPassword] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(initialSuccessMessage || null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setFieldErrors({});

    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      const errors: { email?: string; password?: string } = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as 'email' | 'password';
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    try {
      await signin(validation.data);
      navigate('/dashboard');
    } catch {
      // authError is updated in AuthContext
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
    if (authError) clearAuthError();
    if (successBanner) setSuccessBanner(null);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
    if (authError) clearAuthError();
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
          <CardTitle className="text-2xl font-bold text-[#2B231D]">Sign In</CardTitle>
          <CardDescription className="text-sm text-[#756F68] mt-1">
            Enter your credentials to access your library
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {successBanner && (
              <div className="rounded-xl border border-[#8A582B]/20 bg-[#FAF8F5] p-3.5 text-xs text-[#8A582B] font-medium leading-relaxed">
                {successBanner}
              </div>
            )}

            {authError && (
              <Alert>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={isAuthenticating}
                autoComplete="email"
                error={!!fieldErrors.email}
                autoFocus={!registeredEmail}
                required
              />
              {fieldErrors.email && (
                <p className="text-xs text-[#9E2A2B] font-medium mt-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={isAuthenticating}
                autoComplete="current-password"
                error={!!fieldErrors.password}
                autoFocus={!!registeredEmail}
                required
              />
              {fieldErrors.password && (
                <p className="text-xs text-[#9E2A2B] font-medium mt-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-[#8A582B] hover:text-[#754820] cursor-pointer transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isAuthenticating}
            >
              Sign In
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t border-[#E8DFD3]/60 pt-4">
          <p className="text-xs text-[#756F68]">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-[#8A582B] hover:text-[#754820] cursor-pointer"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
