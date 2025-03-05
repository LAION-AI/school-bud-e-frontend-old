import { useRef, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { IconPhoto } from "@tabler/icons-preact";

export interface Image {
  type: string;
  image_url?: {
    url: string;
    detail: string;
  };
  pdf_url?: {
    url: string;
    detail: string;
  };
}

export function ImageUploadButton({
  onImagesUploaded,
}: {
  onImagesUploaded: (images: Image[]) => void;
}) {
  // deno-lint-ignore no-explicit-any
  const [previewImages, setPreviewImages] = useState<any[]>([]);
  const [imageFiles, _setImageFiles] = useState<Image[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // deno-lint-ignore no-explicit-any
  const handleImageUpload = (event: any) => {
    const files = Array.from(event.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file as Blob),
    }));
    const previousImages = previewImages;
    setPreviewImages([...previousImages, ...newImages]);

    // deno-lint-ignore no-explicit-any
    const newPreviewImages: Image[] = [];
    const promises = files.map((file) => {
      return new Promise<void>((resolve) => {
        const fileReader = new FileReader();

        fileReader.addEventListener("load", (e) => {
          const data_url = e.target!.result as string;
          const type = data_url?.split(";")[0].split(":")[1];

          let fileObject: Image;

          if (type.startsWith("image/")) {
            fileObject = {
              type: "image_url",
              image_url: {
                url: data_url,
                detail: "high",
              },
            };
          } else {
            fileObject = {
              type: "pdf_url",
              pdf_url: {
                url: data_url,
                detail: "high",
              },
            };
          }

          newPreviewImages.push(fileObject);
          resolve();
        });

        fileReader.readAsDataURL(file as Blob);
      });
    });

    Promise.all(promises).then(() => {
      // All files have been processed and newImages is ready for postprocessing
      console.log("All files processed", newPreviewImages);
      const finalImages = [...imageFiles, ...newPreviewImages];
      onImagesUploaded(finalImages);
    });
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
        class="disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2 mr-1 text-gray-600 hover:text-gray-900"
        type="button"
        aria-label="Upload image or PDF"
      >
        <IconPhoto />
      </button>
    </>
  );
}

export default ImageUploadButton; 