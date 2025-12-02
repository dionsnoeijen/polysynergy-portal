'use client';

import { Heading, Subheading } from "@/components/heading";
import { ApplicationLayout } from "@/app/application-layout";
import { Field, Label } from "@/components/fieldset";
import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";
import { Button } from "@/components/button";
import { Text } from "@/components/text";
import { Divider } from "@/components/divider";
import { useState } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { sendFeedback } from '@/api/feedbackApi';

export default function SupportPage() {
  const auth = useUnifiedAuth();
  const [email, setEmail] = useState(auth.user?.profile.email as string || '');
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Feedback submission failed:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ApplicationLayout>
      <div className="mx-auto max-w-4xl p-10">
        <Heading>Support</Heading>
        <Text className="mt-2 text-zinc-600 dark:text-zinc-400">
          Get help, report issues, or share feedback
        </Text>

        <Divider className="my-8" />

        {/* Alpha Notice */}
        <div className="mb-8 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-200 dark:bg-purple-500/40 text-purple-800 dark:text-purple-200 text-xl font-bold">
                α
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-white mb-2">
                This is an Alpha Release
              </h3>
              <Text className="text-purple-800 dark:text-purple-100">
                You&apos;re using early-access software. Some features may be incomplete or change over time.
                We appreciate your patience and feedback as we continue to improve the platform.
              </Text>
            </div>
          </div>
        </div>

        {/* Contact Options */}
        <section className="mb-12">
          <Subheading>Get in Touch</Subheading>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            {/* Documentation */}
            <a
              href="https://www.polysynergy.com/ams/documentation"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-lg transition-colors group"
            >
              <div className="flex-shrink-0 text-3xl">📚</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Documentation</div>
                <div className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Online Documentation
                </div>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:dion@polysynergy.com"
              className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-lg transition-colors group"
            >
              <div className="flex-shrink-0 text-3xl">📧</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Email Support</div>
                <div className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                  dion@polysynergy.com
                </div>
              </div>
            </a>

            {/* Discord */}
            <a
              href="https://discord.gg/g3atXten"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-lg transition-colors group"
            >
              <div className="flex-shrink-0 text-3xl">💬</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Join Community</div>
                <div className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Discord Server
                </div>
              </div>
            </a>

            {/* GitHub Issues */}
            <a
              href="https://github.com/dionsnoeijen/polysynergy/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-lg transition-colors group md:col-span-2"
            >
              <div className="flex-shrink-0 text-3xl">🐛</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Report Issues</div>
                <div className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  GitHub Issues Tracker
                </div>
              </div>
            </a>
          </div>
        </section>

        <Divider className="my-8" />

        {/* Feedback Form */}
        <section>
          <Subheading>Send Feedback</Subheading>
          <Text className="mt-2 text-zinc-600 dark:text-zinc-400 mb-6">
            Have questions, suggestions, or issues? Send us a message and we&apos;ll get back to you.
          </Text>

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <Text className="text-green-700 dark:text-green-300 font-medium">
                  Message sent successfully! We&apos;ll get back to you soon.
                </Text>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <Text className="text-red-600 dark:text-red-400">{error}</Text>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Field>
              <Label htmlFor="email">Your Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question, issue, or feedback..."
                rows={8}
                required
                disabled={isSubmitting}
              />
            </Field>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </ApplicationLayout>
  );
}
