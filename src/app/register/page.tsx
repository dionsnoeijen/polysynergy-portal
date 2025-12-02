'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Field, Label } from '@/components/fieldset';
import { standaloneRegister } from '@/api/standaloneAuthApi';
import { useBranding } from '@/contexts/branding-context';

export default function RegisterPage() {
    const router = useRouter();
    const { logo_url, accent_color } = useBranding();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            // Register the user with the auth API
            const response = await standaloneRegister({
                email,
                password,
                first_name: firstName,
                last_name: lastName,
            });

            console.log('Registration response:', response);

            setSuccess(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
            setIsLoading(false);
        }
    };

    // Convert hex to rgba for gradient
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 14, g: 165, b: 233 }; // fallback to sky-500
    };

    const rgb = hexToRgb(accent_color);
    const gradientStyle = {
        background: `linear-gradient(to bottom right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3))`,
    };

    if (success) {
        return (
            <div className="fixed inset-0 flex items-center justify-center dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-800" style={gradientStyle}>
                <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-xl text-center">
                    <div className="mb-4">
                        <svg className="w-16 h-16 mx-auto text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        Registration Successful!
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Your account has been created. Redirecting to login...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-800" style={gradientStyle}>
            <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-xl">
                <div className="text-center mb-8">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <img
                            src={logo_url || "/ps-logo-simple-color.svg"}
                            alt="Logo"
                            className="h-16 w-16"
                        />
                    </div>

                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                        Create Account
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Join PolySynergy today
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Field>
                            <Label>First Name</Label>
                            <Input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="John"
                                disabled={isLoading}
                            />
                        </Field>

                        <Field>
                            <Label>Last Name</Label>
                            <Input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Doe"
                                disabled={isLoading}
                            />
                        </Field>
                    </div>

                    <Field>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            disabled={isLoading}
                            autoFocus
                        />
                    </Field>

                    <Field>
                        <Label>Password</Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                        />
                    </Field>

                    <Field>
                        <Label>Confirm Password</Label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                        />
                    </Field>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        color="sky"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="hover:underline font-medium"
                            style={{ color: accent_color }}
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
