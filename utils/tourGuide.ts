// Replace the entire file with:
import { signal } from "@preact/signals";
import Shepherd from "npm:shepherd.js@14.5.0";

// Check if we're in a browser environment
const isBrowser = typeof globalThis !== "undefined" &&
  globalThis.document !== undefined;

// Define types for Shepherd Tour to avoid namespace errors
type ShepherdTour = (typeof Shepherd)["Tour"];

// Signal to track if a tour is currently active
export const isTourActive = signal<boolean>(false);

// Signal to track completed tours
export const completedTours = signal<string[]>([]);

// Signal to track the current active tour ID
export const activeTourId = signal<string | null>(null);

// Signal to track the current step index
export const currentStepIndex = signal<number>(0);

// Signal to track available tours
export const tours = signal<{
  id: string;
  title: string;
  description: string;
  completed: boolean;
  steps: {
    id: string;
    title: string;
    text: string;
    attachTo?: {
      element: string;
      on: "top" | "bottom" | "left" | "right";
    };
  }[];
}[]>([
  {
    id: "basics",
    title: "Basics Tour",
    description: "Learn the basic features of Bud-E",
    completed: false,
    steps: [],
  },
  {
    id: "chat",
    title: "Chat Features",
    description: "Explore the chat capabilities",
    completed: false,
    steps: [],
  },
  {
    id: "api-setup",
    title: "API Setup",
    description: "Set up your API keys",
    completed: false,
    steps: [],
  },
]);

// Function to mark a tour as completed
export function markTourComplete(tourId: string) {
  if (!completedTours.value.includes(tourId)) {
    completedTours.value = [...completedTours.value, tourId];

    // Update the tours signal
    tours.value = tours.value.map((tour) =>
      tour.id === tourId ? { ...tour, completed: true } : tour
    );

    // Save completed tours to localStorage
    if (isBrowser) {
      localStorage.setItem(
        "shepherd-completed-tours",
        JSON.stringify(completedTours.value),
      );

      // Clear the active tour state
      localStorage.removeItem("shepherd-tour-state");
      activeTourId.value = null;
      currentStepIndex.value = 0;

      // Dispatch a custom event
      globalThis.dispatchEvent(
        new CustomEvent("tour:complete", { detail: { tourId } }),
      );
    }
  }
}

// Store the tour instances
const tourInstances: Record<string, unknown> = {};

// Function to save the current tour state
export function saveTourState() {
  if (!isBrowser) return;

  if (activeTourId.value) {
    // Save to localStorage for persistence across page navigation
    localStorage.setItem("shepherd-active-tour-id", activeTourId.value);
    localStorage.setItem(
      "shepherd-current-step-index",
      currentStepIndex.value.toString(),
    );

    // Save the combined state for easier retrieval
    localStorage.setItem(
      "shepherd-tour-state",
      JSON.stringify({
        tourId: activeTourId.value,
        stepIndex: currentStepIndex.value,
      }),
    );
  }
}

// Function to initialize the tour guide
export function initTourGuide() {
  if (!isBrowser) return;

  // Load completed tours from localStorage
  const completedToursJson = localStorage.getItem("shepherd-completed-tours");
  let completedTours: string[] = [];
    debugger;
  if (completedToursJson) {
    try {
      completedTours = JSON.parse(completedToursJson);
      // Update the completed status for each tour
      tours.value = tours.value.map((tour) => ({
        ...tour,
        completed: completedTours.includes(tour.id),
      }));
    } catch (error) {
      console.error("Error parsing completed tours:", error);
    }
  }

  // Check if there's an active tour to resume
  const savedTourId = localStorage.getItem("shepherd-active-tour-id");
  if (savedTourId && !completedTours.includes(savedTourId)) {
    activeTourId.value = savedTourId;

    const savedStepIndex = localStorage.getItem("shepherd-current-step-index");
    if (savedStepIndex) {
      currentStepIndex.value = Number.parseInt(savedStepIndex, 10);
    }
  } else {
    localStorage.removeItem("shepherd-active-tour-id");
    localStorage.removeItem("shepherd-current-step-index");
    localStorage.removeItem("shepherd-tour-state");
  }
}

// Function to start a tour
export function startTour(tourId: string) {
  if (!isBrowser) return;

  // Set the active tour ID
  activeTourId.value = tourId;

  // Check if we need to resume at a specific step
  const savedStepIndex = localStorage.getItem("shepherd-current-step-index");
  const stepIndex = savedStepIndex ? Number.parseInt(savedStepIndex, 10) : 0;
  currentStepIndex.value = stepIndex;

  // Save the tour state
  saveTourState();

  // Start the appropriate tour
  let tour: ShepherdTour | undefined;
  switch (tourId) {
    case "basics":
      tour = setupBasicsTour();
      break;
    case "chat":
      tour = setupChatTour();
      break;
    case "api-setup":
      tour = setupApiSetupTour();
      break;
    case "graph":
      tour = setupGraphTour();
      break;
    default: {
      // Check if it's a custom tour
      const customTour = tours.value.find((t) => t.id === tourId);
      if (customTour) {
        tour = setupCustomTour(customTour);
      }
      break;
    }
  }

  if (tour) {
    // Store the active tour in the globalThis object for cross-page access
    (globalThis as any).activeTour = tour;

    // Start the tour
    tour.start();

    // If we need to resume at a specific step, show that step
    if (stepIndex > 0 && tour.steps.length > stepIndex) {
      setTimeout(() => {
        tour?.show(tour.steps[stepIndex].id);
      }, 100);
    }
  }

  return tour;
}

// Function to setup a custom tour
function setupCustomTour(tourData: Tour): ShepherdTour | undefined {
  if (!isBrowser) return undefined;

  if (!Shepherd) return undefined;

  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    modalContainer: document.body,
    defaultStepOptions: {
      classes: "shadow-md bg-white",
      scrollTo: true,
      cancelIcon: {
        enabled: true,
      },
      arrow: false,
    },
  });

  // Add event listeners to manage the shepherd-active class
  tour.on("show", (event: ShepherdEvent) => {
    document.body.classList.add("shepherd-active");
    isTourActive.value = true;

    // Update the current step index
    if (event?.step) {
      const index = tour.steps.indexOf(event.step);
      if (index !== -1) {
        currentStepIndex.value = index;
        // Save the current state
        saveTourState();
      }
    }
  });

  tour.on("complete", () => {
    document.body.classList.remove("shepherd-active");
    isTourActive.value = false;
    activeTourId.value = null;
    currentStepIndex.value = 0;

    // Clear the saved state
    localStorage.removeItem("shepherd-tour-state");
    localStorage.removeItem("shepherd-active-tour-id");
    localStorage.removeItem("shepherd-current-step-index");

    markTourComplete(tourData.id);
  });

  tour.on("cancel", () => {
    document.body.classList.remove("shepherd-active");
    isTourActive.value = false;
    activeTourId.value = null;
    currentStepIndex.value = 0;

    // Clear the saved state
    localStorage.removeItem("shepherd-tour-state");
    localStorage.removeItem("shepherd-active-tour-id");
    localStorage.removeItem("shepherd-current-step-index");
  });

  // Add steps from the tour data
  if (tourData.steps && tourData.steps.length > 0) {
    for (const step of tourData.steps) {
      const stepOptions: ShepherdStepOptions = {
        id: step.id,
        title: step.title,
        text: step.text,
        buttons: step.buttons || [
          {
            text: "Next",
            action: tour.next,
          },
        ],
        classes: step.classes || "shadow-md bg-white",
      };

      // Add attachTo if provided
      if (step.attachTo) {
        stepOptions.attachTo = step.attachTo;
        stepOptions.arrow = true;
      } else {
        stepOptions.arrow = false;
      }

      // Add beforeShowPromise if provided
      if (step.beforeShowPromise) {
        stepOptions.beforeShowPromise = step.beforeShowPromise;
      }

      // Add when hooks if provided
      if (step.when) {
        stepOptions.when = step.when;
      }

      tour.addStep(stepOptions);
    }
  }

  return tour;
}

// Function to set up the basics tour
function setupBasicsTour(): ShepherdTour | undefined {
  if (!isBrowser) return undefined;

  if (!Shepherd) return undefined;

  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    modalContainer: document.body,
    defaultStepOptions: {
      classes: "shadow-md bg-white",
      scrollTo: true,
      cancelIcon: {
        enabled: true,
      },
      arrow: false,
    },
  });

  // Add event listeners to manage the shepherd-active class
  tour.on("show", (event: ShepherdEvent) => {
    document.body.classList.add("shepherd-active");
    isTourActive.value = true;

    // Update the current step index
    if (event?.step) {
      const index = tour.steps.indexOf(event.step);
      if (index !== -1) {
        currentStepIndex.value = index;
        // Save the current state
        saveTourState();
      }
    }
  });

  tour.on("complete", () => {
    document.body.classList.remove("shepherd-active");
    isTourActive.value = false;
    activeTourId.value = null;
    currentStepIndex.value = 0;

    // Clear the saved state
    localStorage.removeItem("shepherd-tour-state");

    markTourComplete("basics");
  });

  tour.on("cancel", () => {
    document.body.classList.remove("shepherd-active");
    isTourActive.value = false;
    activeTourId.value = null;
    currentStepIndex.value = 0;

    // Clear the saved state
    localStorage.removeItem("shepherd-tour-state");
  });

  tour.addStep({
    id: "welcome",
    title: "Welcome to Bud-E!",
    text: "This brief tour will guide you through the basics of using Bud-E.",
    attachTo: {
      element: ".app-container",
      on: "bottom",
    },
    arrow: true,
    buttons: [
      {
        text: "Skip",
        action: tour.cancel,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "settings",
    title: "Settings",
    text: "Click here to open settings and configure your API keys.",
    attachTo: {
      element: '[data-tour="open-settings-button"]',
      on: "bottom",
    },
    arrow: true,
    buttons: [
      {
        text: "Back",
        action: tour.back,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "chat-input",
    title: "Chat Input",
    text: "Type your messages here to chat with Bud-E.",
    attachTo: {
      element: ".message-input",
      on: "top",
    },
    arrow: true,
    buttons: [
      {
        text: "Back",
        action: tour.back,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "finish",
    title: "All Set!",
    text: "You now know the basics. Enjoy chatting with Bud-E!",
    attachTo: {
      element: ".app-container",
      on: "bottom",
    },
    arrow: true,
    buttons: [
      {
        text: "Finish",
        action: tour.complete,
      },
    ],
  });

  // Store the tour
  tourInstances.basics = tour;

  return tour;
}

// Set up the chat tour
function setupChatTour(): ShepherdTour | undefined {
  if (!isBrowser) return undefined;

  if (!Shepherd) return undefined;

  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    modalContainer: document.body,
    defaultStepOptions: {
      classes: "shadow-md bg-white",
      scrollTo: true,
      cancelIcon: {
        enabled: true,
      },
      arrow: false,
    },
  });

  // Add event listeners to manage the shepherd-active class
  tour.on("show", (event: ShepherdEvent) => {
    document.body.classList.add("shepherd-active");
    isTourActive.value = true;

    // Update the current step index
    if (event?.step) {
      const index = tour.steps.indexOf(event.step);
      if (index !== -1) {
        currentStepIndex.value = index;
        // Save the current state
        saveTourState();
      }
    }
  });

  tour.on("complete", () => {
    document.body.classList.remove("shepherd-active");
    isTourActive.value = false;
    activeTourId.value = null;
    currentStepIndex.value = 0;

    // Clear the saved state
    localStorage.removeItem("shepherd-tour-state");

    markTourComplete("chat");
  });

  tour.on("cancel", () => {
    document.body.classList.remove("shepherd-active");
    isTourActive.value = false;
    activeTourId.value = null;
    currentStepIndex.value = 0;

    // Clear the saved state
    localStorage.removeItem("shepherd-tour-state");
  });

  // Add steps specific to chat features
  tour.addStep({
    id: "chat-welcome",
    title: "Chat Features",
    text: "Let's explore the advanced chat capabilities.",
    attachTo: {
      element: ".app-container",
      on: "bottom",
    },
    arrow: true,
    buttons: [
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  // Add more steps as needed

  // Store the tour
  tourInstances.chat = tour;

  return tour;
}

// Set up the API setup tour
function setupApiSetupTour(): ShepherdTour | undefined {
  if (!isBrowser) return undefined;

  if (!Shepherd) return undefined;

  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    modalContainer: document.body,
    defaultStepOptions: {
      classes: "shadow-md bg-white",
      scrollTo: true,
      cancelIcon: {
        enabled: true,
      },
      arrow: false,
    },
  });

  // Add event listeners to manage the shepherd-active class
  tour.on("show", (event: ShepherdEvent) => {
    document.body.classList.add("shepherd-active");
    isTourActive.value = true;

    // Update the current step index
    if (event?.step) {
      const index = tour.steps.indexOf(event.step);
      if (index !== -1) {
        currentStepIndex.value = index;
        // Save the current state
        saveTourState();
      }
    }
  });

  tour.on("complete", () => {
    document.body.classList.remove("shepherd-active");
    isTourActive.value = false;
    activeTourId.value = null;
    currentStepIndex.value = 0;

    // Clear the saved state
    localStorage.removeItem("shepherd-tour-state");

    markTourComplete("api-setup");
  });

  tour.on("cancel", () => {
    document.body.classList.remove("shepherd-active");
    isTourActive.value = false;
    activeTourId.value = null;
    currentStepIndex.value = 0;

    // Clear the saved state
    localStorage.removeItem("shepherd-tour-state");
  });

  // Add steps specific to API setup
  tour.addStep({
    id: "api-welcome",
    title: "API Setup",
    text: "Let's set up your API keys for full functionality.",
    attachTo: {
      element: ".app-container",
      on: "bottom",
    },
    arrow: true,
    buttons: [
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  // Add more steps as needed

  // Store the tour
  tourInstances["api-setup"] = tour;

  return tour;
}

// Set up the Graph tour
function setupGraphTour(): ShepherdTour | undefined {
  if (!isBrowser) return undefined;

  if (!Shepherd) return undefined;

  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    modalContainer: document.body,
    defaultStepOptions: {
      classes: "shadow-md bg-white",
      scrollTo: true,
      cancelIcon: {
        enabled: true,
      },
      arrow: false,
    },
  });

  // Add event listeners to manage the shepherd-active class
  tour.on("show", (event: ShepherdEvent) => {
    document.body.classList.add("shepherd-active");
    isTourActive.value = true;

    // Update the current step index
    if (event?.step) {
      const index = tour.steps.indexOf(event.step);
      if (index !== -1) {
        currentStepIndex.value = index;
        // Save the current state
        saveTourState();
      }
    }
  });

  tour.on("complete", () => {
    document.body.classList.remove("shepherd-active");
    isTourActive.value = false;
    activeTourId.value = null;
    currentStepIndex.value = 0;

    // Clear the saved state
    localStorage.removeItem("shepherd-tour-state");

    markTourComplete("graph");
  });

  tour.on("cancel", () => {
    document.body.classList.remove("shepherd-active");
    isTourActive.value = false;
    activeTourId.value = null;
    currentStepIndex.value = 0;

    // Clear the saved state
    localStorage.removeItem("shepherd-tour-state");
  });

  // Add steps specific to graph features
  tour.addStep({
    id: "graph-welcome",
    title: "Graph Features",
    text: "Let's explore how to work with the knowledge graph.",
    attachTo: {
      element: ".app-container",
      on: "bottom",
    },
    arrow: true,
    buttons: [
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "graph-nodes",
    title: "Graph Nodes",
    text: "Click on any node to select it and see available actions.",
    attachTo: {
      element: ".border.rounded.bg-gray-50",
      on: "bottom",
    },
    arrow: true,
    buttons: [
      {
        text: "Back",
        action: tour.back,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "node-actions",
    title: "Node Actions",
    text:
      "When a node is selected, you can add, rename, delete, or perform other actions using these buttons.",
    attachTo: {
      element: ".absolute.bottom-4",
      on: "top",
    },
    arrow: true,
    buttons: [
      {
        text: "Back",
        action: tour.back,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "graph-finish",
    title: "All Set!",
    text:
      "You now know how to work with the knowledge graph. Try creating and connecting some nodes!",
    attachTo: {
      element: ".app-container",
      on: "bottom",
    },
    arrow: true,
    buttons: [
      {
        text: "Finish",
        action: tour.complete,
      },
    ],
  });

  // Store the tour
  tourInstances.graph = tour;

  return tour;
}

// Function to add a new tour
export function addTour(id: string, title: string, description: string) {
  if (!isBrowser) return;

  // Add to the tours signal
  tours.value = [...tours.value, {
    id,
    title,
    description,
    completed: false,
    steps: [],
  }];

  if (!Shepherd) return;

  // Create a new tour instance
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    modalContainer: document.body,
    defaultStepOptions: {
      classes: "shadow-md bg-white",
      scrollTo: true,
      cancelIcon: {
        enabled: true,
      },
      arrow: false,
    },
  });

  // Add event listeners to manage the shepherd-active class
  tour.on("show", (event: ShepherdEvent) => {
    document.body.classList.add("shepherd-active");
    isTourActive.value = true;

    // Update the current step index
    if (event?.step) {
      const index = tour.steps.indexOf(event.step);
      if (index !== -1) {
        currentStepIndex.value = index;
        // Save the current state
        saveTourState();
      }
    }
  });

  tour.on("complete", () => {
    document.body.classList.remove("shepherd-active");
    isTourActive.value = false;
    activeTourId.value = null;
    currentStepIndex.value = 0;

    // Clear the saved state
    localStorage.removeItem("shepherd-tour-state");

    markTourComplete(id);
  });

  tour.on("cancel", () => {
    document.body.classList.remove("shepherd-active");
    isTourActive.value = false;
    activeTourId.value = null;
    currentStepIndex.value = 0;

    // Clear the saved state
    localStorage.removeItem("shepherd-tour-state");
  });

  // Add a placeholder step
  tour.addStep({
    id: "welcome",
    title: title,
    text: description,
    arrow: false,
    buttons: [
      {
        text: "Finish",
        action: tour.complete,
      },
    ],
  });

  // Store the tour
  tourInstances[id] = tour;
}

// Function to check if a tour is completed
export function isTourCompleted(tourId: string): boolean {
  return completedTours.value.includes(tourId);
}

// Add custom event type
declare global {
  interface WindowEventMap {
    "tour:complete": CustomEvent<{ tourId: string }>;
  }
}

// Augment the window object to recognize Shepherd and activeTour
declare global {
  interface Window {
    Shepherd: any;
    activeTour: any;
  }
}

// Define tour types
export interface TourStep {
  id: string;
  title?: string;
  text: string;
  attachTo?: {
    element: string;
    on: "auto" | "top" | "bottom" | "left" | "right";
  };
  arrow?: boolean;
  buttons?: Array<{
    text: string;
    action?: () => void;
    classes?: string;
  }>;
  classes?: string;
  beforeShowPromise?: () => Promise<void>;
  when?: {
    show?: () => void;
    hide?: () => void;
  };
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  steps: TourStep[];
}

// Shepherd Event interface
interface ShepherdEvent {
  step?: unknown;
}

// Shepherd Step Options interface
interface ShepherdStepOptions {
  id: string;
  title?: string;
  text: string;
  attachTo?: {
    element: string;
    on: "auto" | "top" | "bottom" | "left" | "right";
  };
  arrow?: boolean;
  buttons?: Array<{
    text: string;
    action?: () => void;
    classes?: string;
  }>;
  classes?: string;
  beforeShowPromise?: () => Promise<void>;
  when?: {
    show?: () => void;
    hide?: () => void;
  };
}
