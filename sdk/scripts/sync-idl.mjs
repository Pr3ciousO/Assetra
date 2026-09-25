// Copy the Anchor IDLs + generated types from anchor/target into the SDK.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = join(root, "sdk", "src", "idl");
mkdirSync(out, { recursive: true });
for (const name of ["assetra", "demo_desk"]) {
  copyFileSync(join(root, "anchor", "target", "idl", `${name}.json`), join(out, `${name}.json`));
  copyFileSync(join(root, "anchor", "target", "types", `${name}.ts`), join(out, `${name}.ts`));
}
console.log("synced IDLs →", out);
