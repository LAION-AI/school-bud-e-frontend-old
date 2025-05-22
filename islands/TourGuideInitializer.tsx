import { useEffect } from "preact/hooks";
import { initTourGuide, startTour } from "../utils/tourGuide.ts";

// Define a minimal interface for the tour instance
interface TourInstance {
  steps: Array<{ id: string }>;
  show: (id: string) => void;
}

// Add type declaration for the globalThis object
declare global {
  interface globalThis {
    activeTour?: TourInstance;
  }
}

export default function TourGuideInitializer() {
  useEffect(() => {
    // Initialize the tour guide
    initTourGuide();

    // Check if there's a saved tour state to resume
    const savedState = localStorage.getItem("shepherd-tour-state");
    if (savedState) {
      try {
        const { tourId, stepIndex } = JSON.parse(savedState);
        if (tourId && stepIndex !== undefined) {
          // Resume the tour with a slight delay to ensure the page is fully loaded
          setTimeout(() => {
            // Start the tour with the saved ID
            startTour(tourId);

            // Store the active tour ID and step index
            localStorage.setItem("shepherd-active-tour-id", tourId);
            localStorage.setItem(
              "shepherd-current-step-index",
              stepIndex.toString(),
            );

            // The tour will be started by the startTour function
            // We don't need to manually show a specific step as the tour
            // will be configured to start at the correct step
          }, 500);
        }
      } catch (error) {
        console.error("Error parsing saved tour state:", error);
        // Clear invalid state
        localStorage.removeItem("shepherd-tour-state");
      }
    }

    // Add event listener for page unload to save the current tour state
    const handleBeforeUnload = () => {
      const activeTourId = localStorage.getItem("shepherd-active-tour-id");
      const currentStepIndex = localStorage.getItem(
        "shepherd-current-step-index",
      );

      if (activeTourId && currentStepIndex) {
        localStorage.setItem(
          "shepherd-tour-state",
          JSON.stringify({
            tourId: activeTourId,
            stepIndex: Number.parseInt(currentStepIndex, 10),
          }),
        );
      }
    };

    // Use addEventListener directly without specifying the type
    addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
