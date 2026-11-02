import type { ImgHTMLAttributes } from "react";
import { photoSources } from "@/lib/images";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes"> & {
  src: string;
  /** How wide the picture is shown, e.g. "50vw" or "128px". */
  sizes: string;
};

/**
 * A product or category photo at the size the screen needs: AVIF where the
 * browser takes it, WebP otherwise (see lib/images.ts). Takes the same props
 * as <img>, and the <picture> around it is display: contents, so the <img>
 * lays out exactly as a bare one would. Other images render as a plain <img>.
 */
export default function Photo({ src, sizes, alt = "", decoding = "async", ...img }: Props) {
  const sources = photoSources(src);
  if (!sources) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} decoding={decoding} {...img} />;
  }
  return (
    <picture className="contents">
      <source type="image/avif" srcSet={sources.avif} sizes={sizes} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sources.fallback} srcSet={sources.webp} sizes={sizes} alt={alt} decoding={decoding} {...img} />
    </picture>
  );
}
