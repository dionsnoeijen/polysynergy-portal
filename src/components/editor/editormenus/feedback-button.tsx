import React, {useState} from 'react';
import {ChatBubbleLeftRightIcon} from '@heroicons/react/24/outline';
import Modal from '@/components/modal';
import {Input} from '@/components/input';
import {Textarea} from '@/components/textarea';
import {Button} from '@/components/button';
import {sendFeedback} from '@/api/feedbackApi';
import {useAuth} from 'react-oidc-context';

const FeedbackButton: React.FC = () => {
    const auth = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState(auth.user?.profile.email as string || '');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleOpen = () => {
        setIsOpen(true);
        setEmail(auth.user?.profile.email as string || '');
        setMessage('');
        setError(null);
        setSuccess(false);
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setIsOpen(false);
            setMessage('');
            setError(null);
            setSuccess(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !message.trim()) {
            setError('Please provide both email and message');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await sendFeedback(email, message);
            setSuccess(true);
            setMessage('');

            // Auto-close after 2 seconds
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (err) {
            setError('Failed to send feedback. Please try again.');
            console.error('Feedback error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="absolute z-[50] top-2 left-1/2 -translate-x-1/2">
                <button
                    onClick={handleOpen}
                    className="bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105"
                    title="Send Feedback"
                >
                    <ChatBubbleLeftRightIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium">Feedback</span>
                </button>
            </div>

            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Send Feedback"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Help us improve PolySynergy. Your feedback goes directly to the development team.
                    </p>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm text-green-800 dark:text-green-200">
                                Thank you! Your feedback has been sent successfully.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Your Email
                        </label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            disabled={isSubmitting || success}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Message
                        </label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Share your thoughts, suggestions, or report issues..."
                            rows={6}
                            disabled={isSubmitting || success}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300
                                     bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600
                                     rounded-md transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || success}
                            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700
                                     rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                     flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                    Sending...
                                </>
                            ) : success ? (
                                'Sent!'
                            ) : (
                                'Send Feedback'
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default FeedbackButton;
