import type { ComponentType } from "preact";
import TourGuideInitializer from "../islands/TourGuideInitializer.tsx";

export default function Layout({ Component }: { Component: ComponentType<unknown> }) {
  return (
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
      <TourGuideInitializer />
      <Component />
    </div>
  );
} 