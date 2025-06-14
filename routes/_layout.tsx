import type { ComponentType } from "preact";
import TourGuideInitializer from "../islands/TourGuideInitializer.tsx";

export default function Layout(
  { Component }: { Component: ComponentType<unknown> },
) {
  return (
    <div class="md:min-h-screen">
      <TourGuideInitializer />
      <Component />
    </div>
  );
}
