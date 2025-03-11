import { useState } from "preact/hooks";
import { Button } from "../../components/Button.tsx";
import { startTour, tours } from "../../utils/tourGuide.ts";

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

      {/* Tours Modal */}
      {isModalOpen && (
        <dialog
          class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setIsModalOpen(false)}
          aria-modal="true"
          aria-labelledby="tours-modal-title"
        >
          <div
            class="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="document"
          >
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3
                id="tours-modal-title"
                class="text-lg font-medium text-gray-900"
              >
                All Tour Guides
              </h3>
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                class="text-gray-400 hover:text-gray-500 h-auto p-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                  title="Close"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>

            <div class="px-6 py-4">
              <div class="w-full h-2 bg-gray-200 rounded-full mb-6">
                <div
                  class="h-2 rounded-full bg-blue-600 transition-all duration-300 ease-in-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div class="text-center mb-4 text-sm text-gray-500">
                You've completed {completedTours} out of {totalTours} tours (
                {Math.round(progressPercentage)}%)
              </div>

              <div class="flex justify-end mb-3">
                <Button
                  variant="secondary"
                  onClick={toggleShowCompleted}
                  class="text-sm px-3 py-1 rounded-md h-auto flex items-center gap-1"
                >
                  {showCompleted ? (
                    <>
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
                      Hide completed
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        class="w-4 h-4"
                        aria-hidden="true"
                        title="Eye-slash icon"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z"
                          clip-rule="evenodd"
                        />
                        <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                      </svg>
                      Show completed
                    </>
                  )}
                </Button>
              </div>

              <div class="space-y-3">
                {visibleTours?.map((tour, i) => (
                  <div
                    key={`modal-tour-${tour.id}`}
                    class={`p-3 rounded-lg ${
                      tour.completed
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <div class="flex items-start gap-3">
                      <div
                        class={`w-6 h-6 mt-0.5 flex-shrink-0 flex items-center justify-center ${
                          tour.completed ? "bg-blue-600" : "bg-blue-500"
                        } rounded-full text-white text-sm font-medium`}
                      >
                        {i + 1}
                      </div>
                      <div class="flex-1">
                        <h4 class="font-medium text-gray-900 mb-1">
                          {tour.title}
                        </h4>
                        <p class="text-sm text-gray-500 mb-3">
                          {tour.description}
                        </p>
                        <Button
                          variant={tour.completed ? "secondary" : "primary"}
                          onClick={() => {
                            startTour(tour.id);
                            setIsModalOpen(false);
                          }}
                          class={`text-sm px-4 py-2 rounded-md h-auto ${
                            tour.completed
                              ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {tour.completed ? "Replay Tour" : "Start Tour"}
                        </Button>
                      </div>
                      {tour.completed && (
                        <div class="flex-shrink-0 text-blue-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            class="w-5 h-5"
                            aria-hidden="true"
                            title="Completed"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Show message if no tours are visible */}
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

            <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                class="px-4 py-2 rounded-md h-auto bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                Close
              </Button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
