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
  PasswordInput,
} from '../../../shared/components/ui';
import { useAuth } from '../hooks/useAuth';
import { signUpSchema } from '../schemas/auth.schema';

export const SignUpCard: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated, isAuthenticating, authError, clearAuthError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setFieldErrors({});

    const validation = signUpSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validation.success) {
      const errors: {
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
      } = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as
          | 'name'
          | 'email'
          | 'password'
          | 'confirmPassword';
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    try {
      await signup({
        name: validation.data.name,
        email: validation.data.email,
        password: validation.data.password,
      });
      // Redirect to sign in page so the user logs in explicitly with their new credentials
      navigate('/signin', {
        state: {
          registeredEmail: validation.data.email,
          successMessage: 'Account created successfully! Please sign in with your credentials.',
        },
      });
    } catch {
      // authError is updated in AuthContext
    }
  };

  const clearField = (field: 'name' | 'email' | 'password' | 'confirmPassword') => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
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
          <CardTitle className="text-2xl font-bold text-[#2B231D]">Create Account</CardTitle>
          <CardDescription className="text-sm text-[#756F68] mt-1">
            Start your personal reading journey
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {authError && (
              <Alert>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearField('name');
                }}
                disabled={isAuthenticating}
                autoComplete="name"
                error={!!fieldErrors.name}
                autoFocus
                required
              />
              {fieldErrors.name && (
                <p className="text-xs text-[#9E2A2B] font-medium mt-1">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearField('email');
                }}
                disabled={isAuthenticating}
                autoComplete="email"
                error={!!fieldErrors.email}
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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearField('password');
                }}
                disabled={isAuthenticating}
                autoComplete="new-password"
                error={!!fieldErrors.password}
                required
              />
              {fieldErrors.password && (
                <p className="text-xs text-[#9E2A2B] font-medium mt-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearField('confirmPassword');
                }}
                disabled={isAuthenticating}
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
              isLoading={isAuthenticating}
            >
              Create Account
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t border-[#E8DFD3]/60 pt-4">
          <p className="text-xs text-[#756F68]">
            Already have an account?{' '}
            <Link
              to="/signin"
              className="font-semibold text-[#8A582B] hover:text-[#754820] cursor-pointer"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
