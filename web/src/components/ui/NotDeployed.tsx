import { Card } from "./Card";
import { CLUSTER } from "@/lib/config";

export function NotDeployed() {
  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <p className="label mb-4">Not deployed</p>
      <p className="text-sm text-ash">
        Assetra isn&apos;t bootstrapped on <span className="text-ghost">{CLUSTER}</span> yet. Run the bootstrap script, then reload.
      </p>
    </Card>
  );
}
