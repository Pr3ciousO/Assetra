import {
  BaseSignerWalletAdapter,
  WalletNotConnectedError,
  WalletReadyState,
  isVersionedTransaction,
  type TransactionOrVersionedTransaction,
  type WalletName,
} from "@solana/wallet-adapter-base";
import { Keypair, type TransactionVersion } from "@solana/web3.js";

export const DemoWalletName = "Demo Wallet" as WalletName<"Demo Wallet">;
const STORAGE_KEY = "assetra:demo-wallet";

const ICON =
  "data:image/svg+xml;base64," +
  (typeof btoa === "function"
    ? btoa(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="#050607"/><rect x="3.5" y="6.5" width="17" height="12" fill="none" stroke="#e8eaee" stroke-width="1.4"/><rect x="14" y="10.5" width="6.5" height="4" fill="#0af500"/></svg>',
      )
    : "");

/**
 * In-browser demo wallet (devnet only): the key lives in localStorage so judges
 * can try Assetra without installing an extension. Never use with real funds.
 */
export class DemoWalletAdapter extends BaseSignerWalletAdapter {
  name = DemoWalletName;
  url = "https://github.com";
  icon = ICON;
  readonly supportedTransactionVersions: ReadonlySet<TransactionVersion> = new Set(["legacy", 0]);
  private keypair: Keypair | null = null;

  get connecting() {
    return false;
  }
  get publicKey() {
    return this.keypair?.publicKey ?? null;
  }
  get readyState() {
    return typeof window === "undefined" ? WalletReadyState.Unsupported : WalletReadyState.Loadable;
  }

  async connect(): Promise<void> {
    const stored = localStorage.getItem(STORAGE_KEY);
    this.keypair = stored ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(stored))) : Keypair.generate();
    if (!stored) localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.keypair.secretKey)));
    this.emit("connect", this.keypair.publicKey);
  }

  async disconnect(): Promise<void> {
    this.keypair = null;
    this.emit("disconnect");
  }

  async signTransaction<T extends TransactionOrVersionedTransaction<this["supportedTransactionVersions"]>>(tx: T): Promise<T> {
    if (!this.keypair) throw new WalletNotConnectedError();
    if (isVersionedTransaction(tx)) tx.sign([this.keypair]);
    else tx.partialSign(this.keypair);
    return tx;
  }
}
