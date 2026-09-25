import { explorerTx } from "@/lib/config";
import { shortAddr } from "@/lib/format";

export function TxLink({ signature }: { signature: string }) {
  return (
    <a
      href={explorerTx(signature)}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-graphite underline-offset-4 transition-colors hover:text-frontier hover:decoration-frontier"
    >
      View tx {shortAddr(signature, 6)} ↗
    </a>
  );
}
