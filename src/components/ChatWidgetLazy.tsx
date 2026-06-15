"use client";

// Client wrapper so ChatWidget can be code-split out of the initial bundle.
// It's a floating helper (FAB + chat drawer) with no above-the-fold content,
// so deferring it past hydration costs nothing visually but removes ~460 lines
// of JS (chat logic + polling) from every page's first load.
import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });

export default function ChatWidgetLazy() {
  return <ChatWidget />;
}
