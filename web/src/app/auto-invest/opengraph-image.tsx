import { OG_CONTENT_TYPE, OG_SIZE, ogAlt, renderOg } from "@/lib/og";

export const alt = ogAlt("autoInvest");
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg("autoInvest");
}
