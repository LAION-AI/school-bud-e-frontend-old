
interface VideoPlayerProps {
  previewImage: string | null;
  videoId: string | null;
  logs: string[];
  isGenerating: boolean;
}

export default function VideoPlayer({ previewImage, videoId, logs, isGenerating }: VideoPlayerProps) {
  return (
    <div className="space-y-6">
      <div
        className="aspect-video bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 relative"
        style={{
          backgroundImage: previewImage
            ? `url('${previewImage}')`
            : "url('/lines.svg')",
          backgroundPosition: "center",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Video novel content will be displayed here */}
        {logs.length > 0 && isGenerating && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 max-h-32 overflow-y-auto text-xs">
            {logs.map((log, index) => (
              <div
                key={`log-${index}-${log.substring(0, 10)}`}
                className="text-gray-300"
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug info */}
      {videoId && (
        <div className="bg-gray-100/90 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-2 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300">
          <p>Current Video ID: {videoId}</p>
          {previewImage && <p>Current Image: {previewImage}</p>}
        </div>
      )}
    </div>
  );
} 