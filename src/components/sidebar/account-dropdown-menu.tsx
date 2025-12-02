import {
    DropdownDivider,
    DropdownItem,
    DropdownLabel,
    DropdownMenu
} from "@/components/dropdown";
import {
    ArrowRightStartOnRectangleIcon,
    ShieldCheckIcon,
    UserCircleIcon
} from "@heroicons/react/24/outline";
import React, { useState } from "react";
import Modal from "@/components/modal";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

export default function AccountDropdownMenu({ anchor }: { anchor: 'top start' | 'bottom end' }) {
    const auth = useUnifiedAuth();
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

    const signOutRedirect = async (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();

        try {
            // Use unified auth signout (works for both Cognito and Standalone)
            await auth.signoutRedirect();
        } catch (error) {
            console.error("Error during sign out:", error);
        }
    };

    return (
        <>
            <DropdownMenu className="min-w-64" anchor={anchor}>
                <DropdownItem href="/account">
                    <UserCircleIcon />
                    <DropdownLabel>My account</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="#" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); setShowPrivacyPolicy(true); }}>
                    <ShieldCheckIcon />
                    <DropdownLabel>Privacy policy</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="#" onClick={signOutRedirect}>
                    <ArrowRightStartOnRectangleIcon />
                    <DropdownLabel>Sign out</DropdownLabel>
                </DropdownItem>
            </DropdownMenu>

            {/* Privacy Policy Modal */}
            <Modal isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} title="Privacy Policy">
                <div className="p-6 space-y-4 text-sm text-zinc-700 dark:text-zinc-300 max-h-[70vh] overflow-y-auto">
                    <section>
                        <h3 className="font-semibold text-base mb-2 text-zinc-900 dark:text-white">1. Information We Collect</h3>
                        <p>We collect information you provide directly to us, including your name, email address, and any other information you choose to provide when using our service.</p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-base mb-2 text-zinc-900 dark:text-white">2. How We Use Your Information</h3>
                        <p>We use the information we collect to:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process your transactions and send related information</li>
                            <li>Send you technical notices and support messages</li>
                            <li>Respond to your comments and questions</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-semibold text-base mb-2 text-zinc-900 dark:text-white">3. Information Sharing</h3>
                        <p>We do not share your personal information with third parties except as described in this policy. We may share information in the following circumstances:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                            <li>With your consent</li>
                            <li>To comply with legal obligations</li>
                            <li>To protect our rights and prevent fraud</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-semibold text-base mb-2 text-zinc-900 dark:text-white">4. Data Security</h3>
                        <p>We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.</p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-base mb-2 text-zinc-900 dark:text-white">5. Your Rights</h3>
                        <p>You have the right to:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                            <li>Access and receive a copy of your personal data</li>
                            <li>Rectify inaccurate personal data</li>
                            <li>Request deletion of your personal data</li>
                            <li>Object to processing of your personal data</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-semibold text-base mb-2 text-zinc-900 dark:text-white">6. Contact Us</h3>
                        <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@polysynergy.com" className="text-sky-600 dark:text-sky-400 hover:underline">privacy@polysynergy.com</a></p>
                    </section>

                    <section className="text-xs text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                        <p>Last updated: {new Date().toLocaleDateString()}</p>
                    </section>
                </div>
            </Modal>
        </>
    )
}
