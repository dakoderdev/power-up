"use client";

import { Check } from "pixelarticons/react/Check.js";
import { Close } from "pixelarticons/react/Close.js";
import { Hourglass } from "pixelarticons/react/Hourglass.js";
import { InfoBox } from "pixelarticons/react/InfoBox.js";
import { WarningDiamond } from "pixelarticons/react/WarningDiamond.js";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <Check aria-hidden="true" className="size-4" />,
        info: <InfoBox aria-hidden="true" className="size-4" />,
        warning: <WarningDiamond aria-hidden="true" className="size-4" />,
        error: <Close aria-hidden="true" className="size-4" />,
        loading: <Hourglass aria-hidden="true" className="size-4" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          fontFamily: "inherit",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          title: "font-medium!",
          description: "text-sm! text-muted-foreground!",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
