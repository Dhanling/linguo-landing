// Tracking helper for Facebook Pixel + GA4
// Usage: import { trackEvent } from "@/src/lib/tracking";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  // Facebook Pixel
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }

  // Google Analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }

  console.log("[Track]", eventName, params);
}

// Pre-defined events for Linguo
export const tracking = {
  // Funnel events
  funnelStart: (language: string) =>
    trackEvent("InitiateCheckout", { content_name: language, content_category: "funnel_start" }),

  funnelLanguageSelected: (language: string) =>
    trackEvent("ViewContent", { content_name: language, content_category: "language_selected" }),

  funnelProgramSelected: (language: string, program: string) =>
    trackEvent("AddToCart", { content_name: `${language} - ${program}`, content_category: "program_selected" }),

  // Registration
  registrationComplete: (language: string, program: string) =>
    trackEvent("CompleteRegistration", {
      content_name: `${language} - ${program}`,
      content_category: "registration",
      status: "pending_payment",
    }),

  // Payment
  paymentInitiated: (language: string, amount: number) =>
    trackEvent("InitiateCheckout", {
      content_name: language,
      value: amount,
      currency: "IDR",
    }),

  paymentComplete: (language: string, amount: number) =>
    trackEvent("Purchase", {
      content_name: language,
      value: amount,
      currency: "IDR",
    }),

  // Leads
  leadGenerated: (source: string) =>
    trackEvent("Lead", { content_category: source }),

  // Page views
  pageView: (page: string) =>
    trackEvent("PageView", { page_title: page }),
};
