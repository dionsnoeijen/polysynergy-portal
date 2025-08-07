'use client';

import { useAuth } from "react-oidc-context";
import React, { useState } from "react";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Checkbox, CheckboxField } from "@/components/checkbox";
import { Select } from "@/components/select";
import {activateClientAccount, createClientAccount} from "@/api/clientAccountsApi";
import Modal from "@/components/modal";

export default function CompleteAccount({isAccountSynced, isAccountActive}: {isAccountSynced: boolean, isAccountActive: boolean}) {
    const auth = useAuth();
    const [tenantName, setTenantName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [accountType, setAccountType] = useState('single_user');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!termsAccepted) {
            setError("You must accept the Terms & Conditions to proceed.");
            return;
        }

        if (!auth.user?.profile.sub) {
            setError("Authentication error: User ID is missing.");
            return;
        }

        if (!auth.user?.profile.email) {
            setError("Authentication error: Email is missing.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {

            let response: Response;

            if (!isAccountSynced && isAccountActive) {
                response = await createClientAccount({
                    cognito_id: auth.user.profile.sub,
                    tenant_name: accountType === 'tenant' ? tenantName : auth.user?.profile.email,
                    first_name: firstName,
                    last_name: lastName,
                    email: auth.user?.profile.email,
                    role: 'Admin'
                });
            } else {
                response = await activateClientAccount(
                    firstName,
                    lastName,
                    auth.user.profile.sub
                );
            }

            if (response.ok) {
                window.location.reload();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to create account. Please try again.');
            }
        } catch (err) {
            console.error("Error during account creation:", err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto p-10">
            <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Almost there!</h1>
            <h3 className="text-lg font-medium mb-6 text-gray-900 dark:text-white">Complete your account</h3>

            {error && <p className="text-red-600 mb-4">{error}</p>}

            <form onSubmit={handleSubmit}>
                {!isAccountSynced && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Account Type</label>
                            <Select
                                value={accountType}
                                onChange={(e) => setAccountType(e.target.value)}
                                aria-label="Account Type"
                            >
                                <option value="single_user">Single User</option>
                                <option value="tenant">Organization</option>
                            </Select>
                        </div>

                        {accountType === 'tenant' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                                    Organization Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={tenantName}
                                    onChange={(e) => setTenantName(e.target.value)}
                                    placeholder="e.g. Acme Corp, ABC Inc, My Business LLC"
                                    required
                                />
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    The name of your company or organization
                                </p>
                            </div>
                        )}
                    </>
                )}

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">First Name</label>
                    <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your first name"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Last Name</label>
                    <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                        required
                    />
                </div>

                <div className="mb-4">
                    <CheckboxField>
                        <Checkbox
                            checked={termsAccepted}
                            onChange={() => setTermsAccepted(!termsAccepted)}
                        />
                        <span className="ml-2 text-gray-900 dark:text-white">
                            I accept the{" "}
                            <button
                                type="button"
                                onClick={() => setIsTermsModalOpen(true)}
                                className="text-blue-600 dark:text-blue-400 underline"
                            >
                                Terms & Conditions
                            </button>.
                        </span>
                    </CheckboxField>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Complete Account'}
                    </Button>
                </div>
            </form>

            {isTermsModalOpen && (
                <Modal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)}>
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Terms & Conditions</h2>
                    <p className="mb-6 text-gray-900 dark:text-white">
                        Welcome to PolySynergy! By creating an account and using our platform, you agree to the
                        following Terms & Conditions. Please read them carefully before proceeding.
                    </p>

                    <ul className="list-disc pl-6 mb-6 space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <li>
                            <strong>Account Responsibilities:</strong> You are responsible for maintaining the
                            confidentiality of your account credentials and for all activities that occur under your
                            account.
                        </li>
                        <li>
                            <strong>Acceptable Use:</strong> You agree to use PolySynergy only for lawful purposes. Any
                            misuse, such as unauthorized access or malicious activities, is strictly prohibited.
                        </li>
                        <li>
                            <strong>Data Privacy:</strong> Your personal information will be processed in accordance
                            with our <a href="/privacy-policy" className="text-blue-600 dark:text-blue-400 underline">Privacy Policy</a>.
                            By agreeing to these terms, you consent to the processing of your data as described.
                        </li>
                        <li>
                            <strong>Service Availability:</strong> While we strive to provide a reliable service,
                            PolySynergy does not guarantee uninterrupted access and is not liable for any downtime or
                            technical issues.
                        </li>
                        <li>
                            <strong>Intellectual Property:</strong> All content, trademarks, and materials on
                            PolySynergy are the intellectual property of their respective owners. You may not duplicate,
                            distribute, or use any material without prior consent.
                        </li>
                        <li>
                            <strong>Termination of Service:</strong> PolySynergy reserves the right to suspend or
                            terminate accounts that violate these Terms & Conditions without prior notice.
                        </li>
                        <li>
                            <strong>Changes to Terms:</strong> PolySynergy may update these Terms & Conditions at any
                            time. Continued use of the platform constitutes acceptance of any modifications.
                        </li>
                    </ul>

                    <p className="mb-6 text-gray-900 dark:text-white">
                        By proceeding, you confirm that you have read, understood, and agree to these Terms &
                        Conditions. If you do not agree, please discontinue your use of the platform.
                    </p>
                    <div className="flex justify-end">
                        <Button onClick={() => setIsTermsModalOpen(false)}>Close</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}