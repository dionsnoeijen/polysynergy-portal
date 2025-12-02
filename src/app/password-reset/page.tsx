'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Field, Label } from '@/components/fieldset';
import { standalonePasswordReset } from '@/api/standaloneAuthApi';
import { useBranding } from '@/contexts/branding-context';

export default function PasswordResetPage() {
    const { logo_url, accent_color } = useBranding();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await standalonePasswordReset({ email });
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Password reset request failed');
        } finally {
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        Check Your Email
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                        We&apos;ve sent password reset instructions to <strong>{email}</strong>
                    </p>
                    <Link href="/login">
                        <Button color="sky" className="w-full">
                            Back to Login
                        </Button>
                    </Link>
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={logo_url || "/ps-logo-simple-color.svg"}
                            alt="Logo"
                            className="h-16 w-16"
                        />
                    </div>

                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                        Reset Password
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Enter your email to receive reset instructions
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
                        {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Remember your password?{' '}
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
