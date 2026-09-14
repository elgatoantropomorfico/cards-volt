"use client";

import * as React from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { META_PIXEL_ID } from "@/lib/meta-pixel";

/**
 * Meta Pixel base: loads fbevents, init + PageView on first load,
 * and re-fires PageView on App Router navigations.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const booted = React.useRef(false);

  React.useEffect(() => {
    if (typeof window.fbq !== "function") return;
    // First PageView is in the init snippet; skip duplicate on mount
    if (!booted.current) {
      booted.current = true;
      return;
    }
    window.fbq("track", "PageView");
  }, [pathname, searchParams]);

  if (!META_PIXEL_ID) return null;

  return (
    <Script
      id="meta-pixel-base"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
        `.trim(),
      }}
    />
  );
}

/** Suspense boundary required for useSearchParams in App Router */
export function MetaPixelRoot() {
  return (
    <React.Suspense fallback={null}>
      <MetaPixel />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </React.Suspense>
  );
}
