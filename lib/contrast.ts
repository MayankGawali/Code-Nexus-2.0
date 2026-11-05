import { z } from "zod";
export const hex = /^#[0-9a-f]{6}$/i;
export const posterStyleSchema = z
  .object({
    foreground: z
      .string()
      .regex(hex, "Use a six-digit hex colour, such as #173B34."),
    background: z.string().min(1).max(200),
    kind: z.enum(["solid", "unsupported"]),
  })
  .refine((s) => s.kind !== "solid" || hex.test(s.background), {
    message: "A solid background must be a six-digit hex colour.",
    path: ["background"],
  });
export type PosterStyle = z.infer<typeof posterStyleSchema>;
export const defaultPoster: PosterStyle = {
  foreground: "#ffffff",
  background: "#173b34",
  kind: "solid",
};
export function luminance(colour: string) {
  if (!hex.test(colour)) throw Error("Unknown colour.");
  const channels = [1, 3, 5]
    .map((i) => parseInt(colour.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
export function contrastRatio(foreground: string, background: string) {
  const a = luminance(foreground),
    b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
export function checkContrast(style?: PosterStyle) {
  if (
    !style ||
    style.kind !== "solid" ||
    !hex.test(style.foreground) ||
    !hex.test(style.background)
  )
    return {
      verdict: "Needs manual review" as const,
      ratio: null,
      explanation:
        "Cannot measure a reliable contrast ratio for an image, gradient or unknown colour. Supply known solid colours for the CTA.",
    };
  const ratio = contrastRatio(style.foreground, style.background);
  return {
    verdict: ratio >= 4.5 ? ("Supported" as const) : ("Contradicted" as const),
    ratio,
    explanation: `CTA uses ${style.foreground} on ${style.background}. Normal-size text (16px, regular) requires at least 4.5:1; the unrounded measured ratio is ${ratio.toFixed(6)}:1.`,
  };
}
