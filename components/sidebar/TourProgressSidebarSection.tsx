import { useState } from "preact/hooks";
import { Button } from "../../components/Button.tsx";
import { startTour, tours } from "../../utils/tourGuide.ts";
import Modal from "../../islands/Modal.tsx";

export function TourProgressSidebarSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Calculate progress
  const totalTours = tours.value?.length || 0;
  const completedTours =
    tours.value?.filter((tour) => tour.completed)?.length || 0;
  const progressPercentage =
    totalTours > 0 ? (completedTours / totalTours) * 100 : 0;

  // Filter tours based on completion status
  const visibleTours = showCompleted
    ? tours.value
    : tours.value?.filter((tour) => !tour.completed);

  // If all tours are completed and we're not showing completed tours, don't render the sidebar section
  if (completedTours === totalTours && !showCompleted) {
    return null;
  }

  // Function to toggle showing completed tours
  const toggleShowCompleted = () => {
    setShowCompleted(!showCompleted);
  };

  return (
    <>
      <div class="px-4 pt-2 pb-2 border-t border-gray-200">
        <div class="flex flex-col gap-1">
          <div class="flex justify-between items-center">
            <div class="text-slate-700 font-medium text-sm">Tour Guide</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              class="text-xs text-blue-600 hover:text-blue-800 h-auto p-0"
            >
              View all
            </Button>
          </div>

          {/* Progress bar */}
          <div class="w-full h-1.5 bg-gray-200 rounded-full mb-1">
            <div
              class="h-1.5 rounded-full bg-blue-600 transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div class="text-slate-500 text-xs mb-1 flex justify-between">
            <span>Learn how to use School Bud-E with guided tours.</span>
            <span>
              {completedTours}/{totalTours} completed
            </span>
          </div>

          <div class="flex flex-wrap gap-1.5">
            {/* Only show incomplete tours in the sidebar by default */}
            {tours.value
              ?.filter((tour) => !tour.completed)
              .slice(0, 3)
              .map((tour, i) => (
                <Button
                  key={`tour-${tour.id}`}
                  variant="ghost"
                  onClick={() => startTour(tour.id)}
                  class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors flex-grow h-auto"
                >
                  <div class="w-4 h-4 flex items-center justify-center bg-blue-500 rounded-full text-white text-xs">
                    {i + 1}
                  </div>
                  <div class="flex-1 text-left">
                    <div class="font-medium text-xs">{tour.title}</div>
                  </div>
                </Button>
              ))}

            {/* Show message if no incomplete tours but there are completed tours */}
            {tours.value?.filter((tour) => !tour.completed).length === 0 &&
              completedTours > 0 && (
                <div class="w-full text-center text-sm text-slate-500 py-1">
                  <Button
                    variant="secondary"
                    onClick={toggleShowCompleted}
                    class="text-sm px-3 py-1 rounded-md h-auto flex items-center gap-1 mx-auto"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      class="w-4 h-4"
                      aria-hidden="true"
                      title="Eye icon"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fill-rule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    {showCompleted ? "Hide completed" : "Show completed"}
                  </Button>
                </div>
              )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="All Tour Guides"
        size="md"
      >
        <div class="space-y-4">
          {/* Tour list */}
          <div class="space-y-2">
            {visibleTours?.map((tour) => (
              <div
                key={tour.id}
                class="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium text-gray-900">{tour.title}</h4>
                    <p class="text-sm text-gray-600 mt-1">{tour.description}</p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => startTour(tour.id)}
                    class="text-sm px-3 py-1 h-auto"
                  >
                    Start Tour
                  </Button>
                </div>
              </div>
            ))}

            {visibleTours?.length === 0 && (
              <div class="text-center py-4 text-gray-500">
                No tours to display.
                {!showCompleted && completedTours > 0 && (
                  <Button
                    variant="secondary"
                    onClick={toggleShowCompleted}
                    class="text-sm px-3 py-1 rounded-md h-auto flex items-center gap-1 mx-auto mt-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      class="w-4 h-4"
                      aria-hidden="true"
                      title="Eye icon"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fill-rule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Show completed
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
