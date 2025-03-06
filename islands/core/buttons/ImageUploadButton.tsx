import { useRef, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { IconPhoto, IconLoader2 } from "@tabler/icons-preact";

export interface Image {
  type: string;
  image_url?: {
    url: string;
    detail: string;
    transcription?: string;
  };
  pdf_url?: {
    url: string;
    detail: string;
    size?: number;
    shouldTruncate?: boolean;
    transcription?: string;
    isTranscribing?: boolean;
  };
}

export function ImageUploadButton({
  onImagesUploaded,
  disableSendButton,
}: {
  onImagesUploaded: (images: Image[]) => void;
  disableSendButton: (disabled: boolean) => void;
}) {
  // Using FilePreview instead of any
  interface FilePreview {
    file: File;
    preview: string;
  }
  
  const [previewImages, setPreviewImages] = useState<FilePreview[]>([]);
  const [imageFiles, _setImageFiles] = useState<Image[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transcribingFiles, setTranscribingFiles] = useState<Set<string>>(new Set());

  const onButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Helper to start PDF transcription process
  const transcribePdf = async (file: File, pdfObject: Image) => {
    if (!pdfObject.pdf_url) return;
    
    // Create a unique ID for this file
    const fileId = `pdf-${file.name}-${file.size}-${Date.now()}`;
    
    setTranscribingFiles(prev => {
      const newSet = new Set(prev);
      newSet.add(fileId);
      return newSet;
    });
    
    // Set transcribing flag 
    pdfObject.pdf_url.isTranscribing = true;
    // We don't call onImagesUploaded here anymore - it was already called when the PDF was created
    
    disableSendButton(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      console.log("[Upload] Sending PDF for transcription:", file.name, "Size:", file.size, "Type:", file.type);
      
      // Verify the file is a PDF
      if (file.type !== "application/pdf") {
        console.warn("[Upload] File is not a PDF, type:", file.type);
        pdfObject.pdf_url.transcription = "Error: Not a valid PDF file";
        pdfObject.pdf_url.isTranscribing = false;
        onImagesUploaded([pdfObject]);
        return;
      }
      
      const response = await fetch("/api/transcribe-pdf", {
        method: "POST",
        body: formData,
      });
      
      console.log("[Upload] Transcription response status:", response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log("[Upload] Transcription result:", result);
        
        // Update the PDF object with the transcription
        pdfObject.pdf_url.transcription = result.transcription;
        pdfObject.pdf_url.isTranscribing = false;
        
        console.log("[Upload] PDF transcription completed");
        
        // Notify parent component of the updated PDF object
        onImagesUploaded([pdfObject]);
      } else {
        let errorData: { error?: string; details?: string } = {};
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: await response.text() };
        }
        
        console.error("[Upload] PDF transcription failed:", errorData);
        pdfObject.pdf_url.isTranscribing = false;
        
        // Add error message to the PDF object
        pdfObject.pdf_url.transcription = `Transcription failed: ${errorData.error || errorData.details || "Unknown error"}`;
        
        onImagesUploaded([pdfObject]);
      }
    } catch (error) {
      console.error("[Upload] Error transcribing PDF:", error);
      pdfObject.pdf_url.isTranscribing = false;
      
      // Add error message to the PDF object
      pdfObject.pdf_url.transcription = `Transcription error: ${error instanceof Error ? error.message : String(error)}`;
      
      onImagesUploaded([pdfObject]);
    } finally {
      // Remove from transcribing set
      setTranscribingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        if (newSet.size === 0) {
          disableSendButton(false);
        }
        return newSet;
      });
    }
  };

  const handleImageUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileReader = new FileReader();

      fileReader.onloadend = () => {
        console.log(`[Upload] FileReader onloadend triggered for: ${file.name}`);
        
        if (!fileReader.result) {
          console.error("[Upload] FileReader failed to load file");
          return;
        }
        
        const data_url = fileReader.result as string;
        const type = data_url?.split(";")[0].split(":")[1];
        console.log(`[Upload] Detected MIME type: ${type}`);

        let fileObject: Image;

        if (allowedImageTypes.includes(file.type)) {
          console.log("[Upload] Processing as image");
          fileObject = {
            type: "image_url",
            image_url: {
              url: data_url,
              detail: "high",
              transcription: "",
            },
          };
          onImagesUploaded([fileObject]);
        } else {
          // For PDF files, use a blob URL instead of data URL for large files
          const isPdf = file.type === "application/pdf";
          const isLarge = file.size > 1000000; // 1MB threshold
          
          if (isPdf) {
            console.log(`[Upload] Processing PDF file, size: ${file.size} bytes (${isLarge ? 'large' : 'small'})`);
            
            // Create the PDF object
            fileObject = {
              type: "pdf_url",
              pdf_url: {
                url: data_url,
                detail: isLarge ? "low" : "high",
                size: file.size,
                // Add flag for truncation if needed during API calls
                shouldTruncate: file.size > 5000000, // 5MB max for API calls
                transcription: "",
                isTranscribing: true
              },
            };
            
            console.log(`[Upload] PDF object created, size: ${file.size} bytes`);
            
            // First notify parent component about the uploaded file, then start transcription
            onImagesUploaded([fileObject]);
            
            // Start transcription process separately
            transcribePdf(file, fileObject);
          } else {
            console.log(`[Upload] Processing unknown file type: ${file.type}`);
            fileObject = {
              type: "pdf_url", // Fallback to PDF type for other documents
              pdf_url: {
                url: data_url,
                detail: "high",
                size: file.size,
                transcription: "",
              },
            };
            
            console.log(`[Upload] Generic document object created: ${JSON.stringify(fileObject).substring(0, 100)}...`);
            onImagesUploaded([fileObject]);
          }
        }
      };

      // Read the file as a data URL (base64 encoded)
      console.log(`[Upload] Starting FileReader.readAsDataURL for: ${file.name}`);
      fileReader.readAsDataURL(file);
    }
    
    // Clear the file input to allow selecting the same file again
    if (target) {
      target.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*,application/pdf"
        multiple
        class="hidden"
      />
      <button
        onClick={onButtonClick}
        disabled={!IS_BROWSER}
        class="disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2 mr-1 text-gray-600 hover:text-gray-900 relative"
        type="button"
        aria-label="Upload image or PDF"
      >
        {transcribingFiles.size > 0 ? (
          <IconLoader2 class="animate-spin" />
        ) : (
          <IconPhoto />
        )}
        {transcribingFiles.size > 0 && (
          <span class="absolute top-0 right-0 -mt-1 -mr-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {transcribingFiles.size}
          </span>
        )}
      </button>
    </>
  );
}

// List of allowed image MIME types
const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export default ImageUploadButton; 