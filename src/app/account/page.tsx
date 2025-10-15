'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/button';
import { Divider } from '@/components/divider';
import { Field, Label, Description } from '@/components/fieldset';
import { Heading, Subheading } from '@/components/heading';
import { Input } from '@/components/input';
import { Text } from '@/components/text';
import { ApplicationLayout } from "@/app/application-layout";
import { useAuth } from "react-oidc-context";
import { fetchClientAccount, updateClientAccount } from '@/api/clientAccountsApi';
import { Account } from '@/types/types';

export default function Page() {
    const auth = useAuth();

    // State
    const [account, setAccount] = useState<Account | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Load account on mount
    useEffect(() => {
        const loadAccount = async () => {
            if (!auth.user?.profile.sub) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetchClientAccount(auth.user.profile.sub);
                if (!response.ok) {
                    throw new Error('Failed to load account');
                }
                const data: Account = await response.json();
                setAccount(data);
                setFirstName(data.first_name || '');
                setLastName(data.last_name || '');
            } catch (err) {
                console.error('Failed to load account:', err);
                setError('Failed to load account information');
            } finally {
                setLoading(false);
            }
        };

        loadAccount();
    }, [auth.user?.profile.sub]);

    // Check if there are unsaved changes
    const hasChanges = account && (
        firstName !== (account.first_name || '') ||
        lastName !== (account.last_name || '')
    );

    // Handle cancel - reset to original values
    const handleCancel = () => {
        if (account) {
            setFirstName(account.first_name || '');
            setLastName(account.last_name || '');
        }
        setError(null);
        setSuccess(false);
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!account) return;
        if (!firstName.trim() || !lastName.trim()) {
            setError('First name and last name are required');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const updatedAccount = await updateClientAccount(account.id, {
                first_name: firstName,
                last_name: lastName
            });

            setAccount(updatedAccount);
            setSuccess(true);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (err) {
            console.error('Failed to update account:', err);
            setError('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <ApplicationLayout>
                <div className="mx-auto max-w-2xl p-10">
                    <Heading>Account Settings</Heading>
                    <Divider className="my-6" />
                    <Text>Loading...</Text>
                </div>
            </ApplicationLayout>
        );
    }

    if (!account) {
        return (
            <ApplicationLayout>
                <div className="mx-auto max-w-2xl p-10">
                    <Heading>Account Settings</Heading>
                    <Divider className="my-6" />
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <Text className="text-red-600 dark:text-red-400">
                            {error || 'Account not found'}
                        </Text>
                    </div>
                </div>
            </ApplicationLayout>
        );
    }

    return (
        <ApplicationLayout>
            <div className="mx-auto max-w-2xl p-10">
                <Heading>Account Settings</Heading>
                <Divider className="my-6" />

                <form onSubmit={handleSubmit} className="space-y-8">
                    <section className="space-y-6">
                        <Subheading>Profile Information</Subheading>

                        {/* First Name */}
                        <Field>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                disabled={saving}
                                placeholder="Enter your first name"
                            />
                        </Field>

                        {/* Last Name */}
                        <Field>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                disabled={saving}
                                placeholder="Enter your last name"
                            />
                        </Field>

                        {/* Email (read-only) */}
                        <Field>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={account.email || ''}
                                disabled
                                className="bg-gray-50 dark:bg-zinc-900/50 cursor-not-allowed"
                            />
                            <Description>
                                Contact support to change your email address
                            </Description>
                        </Field>
                    </section>

                    {/* Success Message */}
                    {success && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <Text className="text-green-600 dark:text-green-400">
                                Changes saved successfully!
                            </Text>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <Text className="text-red-600 dark:text-red-400">{error}</Text>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-4">
                        <Button
                            type="button"
                            plain
                            onClick={handleCancel}
                            disabled={saving || !hasChanges}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving || !hasChanges}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </ApplicationLayout>
    );
}
