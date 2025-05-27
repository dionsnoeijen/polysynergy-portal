'use client';

import { Heading } from "@/components/heading";
import { ApplicationLayout } from "@/app/application-layout";
import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";
import { Button } from "@/components/button";
import { useState } from "react";

export default function SupportPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // hier later integratie met email API of AWS SES
    console.log("Verzenden:", { email, message });
  };

  return (
    <ApplicationLayout>
      <Heading>Support</Heading>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="rounded-xl border border-zinc-700 p-4 bg-zinc-900">
          <h2 className="text-lg font-semibold text-white">Documentatie</h2>
          <p className="text-sm text-zinc-300 mt-2">
            Bekijk de uitgebreide handleiding en voorbeelden van node flows.
          </p>
          <a
            href="/docs"
            className="inline-block mt-4 text-sm text-blue-400 hover:underline"
          >
            Ga naar documentatie →
          </a>
        </div>

        <div className="rounded-xl border border-zinc-700 p-4 bg-zinc-900">
          <h2 className="text-lg font-semibold text-white">💡 Feature aanvragen</h2>
          <p className="text-sm text-zinc-300 mt-2">
            Heb je een idee of mis je iets? Laat het weten, ik sta open voor suggesties.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-700 p-4 bg-zinc-900">
          <h2 className="text-lg font-semibold text-white">🐞 Bug melden</h2>
          <p className="text-sm text-zinc-300 mt-2">
            Zie je iets dat niet werkt zoals verwacht? Meld het hier.
          </p>
        </div>
      </div>

      <div className="mt-12 max-w-xl">
        <h2 className="text-lg font-semibold text-white mb-2">✉️ Stuur een bericht</h2>
        <p className="text-sm text-zinc-300 mb-4">
          Heb je vragen, opmerkingen of frustraties? Vul het onderstaande formulier in, ik lees alles zelf.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Jouw e-mailadres"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Textarea
            placeholder="Je bericht..."
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </ApplicationLayout>
  );
}