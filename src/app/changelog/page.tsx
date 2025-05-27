import { Heading } from "@/components/heading";
import { ApplicationLayout } from "@/app/application-layout";

const changelog = [
  {
    version: "v1.2.0",
    date: "2025-05-24",
    changes: [
      "Toegevoegd: Flow execution monitoring via AppSync WebSocket.",
      "Verbeterd: Editor zoom/pan gedrag in nested groups.",
      "Fix: Dict-subvariabelen tonen nu correct in PublishedVariables."
    ]
  },
  {
    version: "v1.1.0",
    date: "2025-05-15",
    changes: [
      "Nieuw: Structured output support in Agent Node via Guidance.",
      "Verbeterd: DynamoDB-opslag van node executions met `order_id`.",
      "Fix: Connection herverbinden in groepen werkt nu correct."
    ]
  },
  {
    version: "v1.0.0",
    date: "2025-05-01",
    changes: [
      "Initiële bèta-release van PolySynergy.",
      "Node editor met group nesting, published vars, en flow execution.",
      "Support voor routes, schedules en forms."
    ]
  }
];

export default function ChangelogPage() {
  return (
    <ApplicationLayout>
      <Heading>Changelog</Heading>
      <div className="mt-6 space-y-8">
        {changelog.map((entry) => (
          <div key={entry.version} className="border-l-2 border-zinc-700 pl-4">
            <div className="text-lg font-semibold text-white">
              {entry.version}
              <span className="ml-2 text-sm text-zinc-400">{entry.date}</span>
            </div>
            <ul className="mt-2 list-disc list-inside text-sm text-zinc-300 space-y-1">
              {entry.changes.map((change, idx) => (
                <li key={idx}>{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ApplicationLayout>
  );
}