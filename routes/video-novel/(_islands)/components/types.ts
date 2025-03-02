export interface Story {
  id: string;
  title: string;
  previewImage: string;
  createdAt: Date;
}

export interface FormData {
  prompt: string;
  style: string;
  customInstructions: string;
} 