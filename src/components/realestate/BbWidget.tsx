"use client";

import { BuyingBuddyProvider, BuyingBuddyWidget, useBuyingBuddy } from "@buyingbuddy/react";
import type { ReactNode } from "react";

type Props = {
  activationKey: string;
  type: string;
  filter?: string;
  height?: string;
  /** Render Buying Buddy's MLS disclaimer under the widget (MLSListings rule). */
  disclaimer?: boolean;
  /** Shown instead of the widget if Buying Buddy's script can't load (ad blocker, outage). */
  fallback: ReactNode;
};

/**
 * One Buying Buddy widget. Several on a page each get a provider; they share
 * one script load because the package keys loads by activation key.
 */
export function BbWidget({ activationKey, ...rest }: Props) {
  return (
    <BuyingBuddyProvider activationKey={activationKey}>
      <Inner {...rest} />
    </BuyingBuddyProvider>
  );
}

function Inner({ type, filter, height, disclaimer, fallback }: Omit<Props, "activationKey">) {
  const { error, isLoaded } = useBuyingBuddy();
  if (error) return <>{fallback}</>;
  return (
    <div aria-busy={!isLoaded || undefined} style={height ? { minHeight: height } : undefined}>
      <BuyingBuddyWidget type={type} filter={filter || undefined} style={height ? { height } : undefined} />
      {disclaimer ? (
        <div className="mt-6 text-sm text-ink-500">
          <BuyingBuddyWidget type="Disclaimer" />
        </div>
      ) : null}
    </div>
  );
}
