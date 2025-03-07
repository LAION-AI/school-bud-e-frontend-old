import type { ComponentType } from "preact";
import TourGuideInitializer from "../islands/TourGuideInitializer.tsx";
import FAQButton from "../islands/FAQButton.tsx";

export default function Layout({ Component }: { Component: ComponentType<unknown> }) {
  return (
    <div class="min-h-screen bg-gray-100">
      <TourGuideInitializer />
      <Component />
      <FAQButton />
    </div>
  );
} 