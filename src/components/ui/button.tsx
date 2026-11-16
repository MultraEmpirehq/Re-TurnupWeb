"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "./button-variants";

import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";


/**
 * A click handler that returns a promise (a save, an upload, any API call)
 * makes the button busy until it settles: it shows the spinner and ignores
 * more clicks, so one click does the work once. `loading` still works as well.
 */
function Button({
  loading,
  className,
  variant,
  disabled,
  size,
  asChild = false,
  children,
  onClick,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  const [pending, setPending] = React.useState(false);
  const pendingRef = React.useRef(false);
  const mounted = React.useRef(true);
  // Set on every mount: React's development mode mounts twice, and a flag left
  // false by the first unmount kept the button busy for good.
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const busy = !!loading || pending;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (pendingRef.current) {
      event.preventDefault();
      return;
    }
    const result = onClick?.(event) as unknown;
    if (result && typeof (result as Promise<unknown>).then === "function") {
      pendingRef.current = true;
      setPending(true);
      void Promise.resolve(result)
        .catch(() => undefined)
        .finally(() => {
          pendingRef.current = false;
          if (mounted.current) setPending(false);
        });
    }
  };

  return (
    <Comp
      disabled={disabled || busy}
      data-slot="button"
      data-loading={busy ? "true" : "false"}
      aria-busy={busy || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={onClick ? handleClick : undefined}
      {...props}
    >
      {/* Slot takes exactly one child, so an asChild button gets its children
          untouched and shows no spinner. */}
      {asChild ? (
        children
      ) : (
        <>
          {busy && <Spinner className="size-4 animate-spin" />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
