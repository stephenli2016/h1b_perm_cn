"use client";

import { useEffect } from "react";

import type { PublicObservabilityConfig } from "@/lib/observability/config";

type ErrorMonitoringListenerProps = {
  config: PublicObservabilityConfig["monitoring"];
};

export function ErrorMonitoringListener({
  config,
}: ErrorMonitoringListenerProps) {
  useEffect(() => {
    if (!config.enabled || !config.endpoint) {
      return undefined;
    }

    function sendError(
      eventType: "error" | "unhandledrejection",
      value: Error,
    ) {
      const payload = {
        eventType,
        message: sanitizeMessage(value.message),
        name: sanitizeMessage(value.name),
        path: window.location.pathname,
        environment: config.environment,
        release: config.release,
        occurredAt: new Date().toISOString(),
      };
      const body = JSON.stringify(payload);

      if (navigator.sendBeacon) {
        navigator.sendBeacon(config.endpoint!, body);
        return;
      }

      fetch(config.endpoint!, {
        body,
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true,
        method: "POST",
      }).catch(() => undefined);
    }

    function handleError(event: ErrorEvent) {
      sendError(
        "error",
        event.error instanceof Error ? event.error : new Error(event.message),
      );
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      sendError(
        "unhandledrejection",
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason)),
      );
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, [config.enabled, config.endpoint, config.environment, config.release]);

  return null;
}

function sanitizeMessage(value: string | undefined) {
  return (value ?? "unknown").replace(/\s+/g, " ").slice(0, 500);
}
