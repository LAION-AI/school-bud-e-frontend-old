import { useEffect, useState } from "preact/hooks";
import { IS_BROWSER } from "fresh/runtime";

interface SlideData {
  title: string;
  content: string[];
  imageUrl?: string | null;
  notes?: string;
}

interface PresentationData {
  type: string;
  title: string;
  slides: SlideData[];
}

interface PresentationPreviewIslandProps {
  id: string;
}

export default function PresentationPreviewIsland(
  { id }: PresentationPreviewIslandProps,
) {
  const [presentationData, setPresentationData] = useState<
    PresentationData | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Load presentation data from localStorage (client-side only)
  useEffect(() => {
    if (IS_BROWSER) {
      try {
        const storedData = localStorage.getItem(`presentation-${id}`);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setPresentationData(parsedData);
        } else {
          setError("Presentation not found");
        }
      } catch (e) {
        console.error("Failed to parse presentation data:", e);
        setError("Failed to load presentation data");
      } finally {
        setIsLoading(false);
      }
    }
  }, [id]);

  const nextSlide = () => {
    if (presentationData && activeSlide < presentationData.slides.length - 1) {
      setActiveSlide(activeSlide + 1);
    }
  };

  const prevSlide = () => {
    if (activeSlide > 0) {
      setActiveSlide(activeSlide - 1);
    }
  };

  // Function to check if a URL is an image
  const isImageUrl = (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(url) ||
      url.startsWith("http") ||
      url.startsWith("data:image");
  };

  const handleThumbnailKeyDown = (e: KeyboardEvent, slideIndex: number) => {
    if (e.key === "Enter" || e.key === " ") {
      setActiveSlide(slideIndex);
    }
  };

  return (
    <>
      {isLoading
        ? (
          <div class="text-center py-12">
            <div class="animate-pulse flex flex-col items-center">
              <div class="h-8 w-64 bg-gray-200 rounded mb-4" />
              <div class="h-4 w-32 bg-gray-200 rounded" />
            </div>
            <p class="mt-4 text-gray-500">Loading presentation data...</p>
          </div>
        )
        : presentationData
        ? (
          <div>
            <h2 class="text-2xl font-bold mb-6">{presentationData.title}</h2>

            {/* Slide viewer with 16:9 aspect ratio */}
            <div class="mt-8 mb-4">
              <div class="relative w-full" style="padding-top: 56.25%">
                {/* 16:9 aspect ratio */}
                <div class="absolute top-0 left-0 w-full h-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  {presentationData.slides.map((slide, slideIndex) => (
                    <div
                      key={`slide-${slide.title}-${slideIndex}`}
                      class={`absolute top-0 left-0 w-full h-full p-8 transition-opacity duration-300 ${
                        slideIndex === activeSlide
                          ? "opacity-100 z-10"
                          : "opacity-0 z-0"
                      }`}
                    >
                      <div class="h-full flex flex-col">
                        {/* Slide title */}
                        <h3 class="text-3xl font-bold mb-6 text-center">
                          {slide.title}
                        </h3>

                        <div class="flex-1 flex flex-row gap-8">
                          {/* Content section */}
                          <div class="flex-1 flex items-center">
                            <ul class="list-disc pl-8 space-y-4 text-xl">
                              {slide.content.map((point, pointIndex) => (
                                <li
                                  key={`point-${slide.title}-${pointIndex}`}
                                  class="text-gray-800"
                                >
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Image section */}
                          {slide.imageUrl && (
                            <div class="w-2/5 flex-shrink-0 flex items-center justify-center">
                              {isImageUrl(slide.imageUrl)
                                ? (
                                  <img
                                    src={slide.imageUrl}
                                    alt={`Illustration for ${slide.title}`}
                                    class="max-w-full max-h-full object-contain rounded shadow-md"
                                    onError={(e) => {
                                      // If image fails to load, show a placeholder
                                      const target = e
                                        .currentTarget as HTMLImageElement;
                                      target.style.display = "none";
                                      const container = target.parentElement;
                                      if (container) {
                                        const placeholder = document
                                          .createElement("div");
                                        placeholder.className =
                                          "w-full h-64 flex items-center justify-center bg-gray-100 rounded shadow-md";
                                        placeholder.innerHTML =
                                          '<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                        container.appendChild(placeholder);
                                      }
                                    }}
                                  />
                                )
                                : (
                                  <div class="w-full h-64 flex items-center justify-center bg-gray-100 rounded shadow-md p-4 text-center">
                                    <div>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-16 w-16 text-gray-400 mx-auto mb-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                      >
                                        <path
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                          stroke-width="1"
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                      <p class="text-sm text-gray-600">
                                        Image suggestion: {slide.imageUrl}
                                      </p>
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation controls */}
              <div class="flex justify-between items-center mt-4">
                <button
                  type="button"
                  onClick={prevSlide}
                  disabled={activeSlide === 0}
                  class={`px-4 py-2 rounded-lg flex items-center ${
                    activeSlide === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  aria-label="Previous slide"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Previous
                </button>

                <div class="text-gray-600">
                  Slide {activeSlide + 1} of {presentationData.slides.length}
                </div>

                <button
                  type="button"
                  onClick={nextSlide}
                  disabled={activeSlide === presentationData.slides.length - 1}
                  class={`px-4 py-2 rounded-lg flex items-center ${
                    activeSlide === presentationData.slides.length - 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  aria-label="Next slide"
                >
                  Next
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 ml-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Presenter notes for current slide */}
            {presentationData.slides[activeSlide]?.notes && (
              <div class="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <h4 class="font-medium text-amber-800 mb-2">
                  Presenter Notes:
                </h4>
                <p class="text-amber-700">
                  {presentationData.slides[activeSlide].notes}
                </p>
              </div>
            )}

            {/* All slides in thumbnail view */}
            <div class="mt-8">
              <h3 class="text-xl font-bold mb-4">All Slides</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {presentationData.slides.map((slide, slideIndex) => (
                  <button
                    key={`thumbnail-${slide.title}-${slideIndex}`}
                    class={`text-left cursor-pointer rounded-lg border p-3 ${
                      slideIndex === activeSlide
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => setActiveSlide(slideIndex)}
                    onKeyDown={(e) => handleThumbnailKeyDown(e, slideIndex)}
                    type="button"
                    aria-label={`Go to slide ${slideIndex + 1}: ${slide.title}`}
                  >
                    <div class="aspect-w-16 aspect-h-9 mb-2">
                      <div class="w-full h-full flex items-center justify-center bg-white">
                        <p class="text-xs text-gray-500 text-center truncate px-1">
                          {slide.title}
                        </p>
                      </div>
                    </div>
                    <p class="text-xs text-center text-gray-600">
                      Slide {slideIndex + 1}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div class="mt-8 flex justify-end">
              <button
                type="button"
                class="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                onClick={() => {
                  alert("Download functionality would be implemented here");
                }}
              >
                Download Presentation
              </button>
            </div>
          </div>
        )
        : (
          <div class="text-center py-12">
            <p class="text-gray-500 mb-4">Presentation ID: {id}</p>
            <p class="text-gray-700">
              {error ||
                "This presentation is not available. It may have been deleted or the ID is invalid."}
            </p>
            <p class="mt-4">
              <a
                href="/presentations"
                class="text-amber-600 hover:text-amber-800 underline"
              >
                Generate a new presentation
              </a>
            </p>
          </div>
        )}
    </>
  );
}
