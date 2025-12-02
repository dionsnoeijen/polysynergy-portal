'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Field, Label } from '@/components/fieldset';
import { standaloneLogin } from '@/api/standaloneAuthApi';
import { useBranding } from '@/contexts/branding-context';

export default function LoginPage() {
    const router = useRouter();
    const { logo_url, accent_color } = useBranding();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await standaloneLogin({ email, password });

            console.log('Login response:', response); // Debug

            // Extract user info from access_token JWT if user object is missing
            let userProfile = response.user;
            if (!userProfile && response.access_token) {
                try {
                    // Decode JWT to get user info
                    const payload = JSON.parse(atob(response.access_token.split('.')[1]));
                    userProfile = {
                        sub: payload.sub || '',
                        email: payload.email || email,
                    };
                } catch (decodeErr) {
                    console.error('Failed to decode JWT:', decodeErr);
                    userProfile = { sub: '', email };
                }
            }

            // Use access_token as id_token if id_token is missing
            const idToken = response.id_token || response.access_token;
            const expiresIn = response.expires_in || 1800; // Default 30 minutes

            // Call the global login function provided by StandaloneAuthProvider
            if (typeof window !== 'undefined') {
                const globalWindow = window as unknown as {
                    standaloneLogin?: (
                        idToken: string,
                        accessToken: string,
                        refreshToken: string | undefined,
                        expiresIn: number,
                        profile: {sub: string; email: string; [key: string]: unknown}
                    ) => void
                };

                if (globalWindow.standaloneLogin) {
                    globalWindow.standaloneLogin(
                        idToken,
                        response.access_token,
                        response.refresh_token,
                        expiresIn,
                        userProfile
                    );
                }
            }

            // Redirect to home page
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
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

    return (
        <div className="fixed inset-0 flex items-center justify-center dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-800" style={gradientStyle}>
            <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-xl">
                <div className="text-center mb-8">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={logo_url || "/ps-logo-simple-color.svg"}
                            alt="Logo"
                            className="h-16 w-16"
                        />
                    </div>

                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Sign in to your PolySynergy account
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/register"
                            className="hover:underline font-medium"
                            style={{ color: accent_color }}
                        >
                            Sign up
                        </Link>
                    </p>
                    <p className="text-sm">
                        <Link
                            href="/password-reset"
                            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
