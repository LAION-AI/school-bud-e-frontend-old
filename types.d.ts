// https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#events
interface SpeechRecognitionEventMap {
  audioend: Event;
  audiostart: Event;
  end: Event;
  error: SpeechRecognitionErrorEvent;
  nomatch: SpeechRecognitionEvent;
  result: SpeechRecognitionEvent;
  soundend: Event;
  soundstart: Event;
  speechend: Event;
  speechstart: Event;
  start: Event;
}

interface WikipediaQuery {
  text: string;
  collection?: string;
  n?: number;
}

interface WikipediaResult {
  Title: string;
  content: string;
  URL: string;
  score: string;
}

interface PapersQuery {
  query: string;
  limit?: number;
}

interface PapersResponse {
  payload: PapersPayload;
}

interface PapersPayload {
  items: PapersItem[];
  total_hits: number;
  has_more: boolean;
}

interface PapersItem {
  id: string;
  doi: string;
  date_published: string;
  title: string;
  abstract: string;
  authors: string[];
  subjects: string[];
}

interface BildungsplanQuery {
  query: string;
  top_n: number;
}

interface BildungsplanResult {
  score: number;
  text: string;
}

interface BildungsplanResponse {
  results: BildungsplanResult[];
}

// Adding a construct signature
interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface RetriableError extends Error {}
interface FatalError extends Error {}

// https://wicg.github.io/speech-api/#speechreco-section
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  abort(): void;
  start(): void;
  stop(): void;
  // deno-lint-ignore no-explicit-any
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

// https://wicg.github.io/speech-api/#speechrecognitionevent
interface SpeechRecognitionEventInit extends EventInit {
  resultIndex?: number;
  results: SpeechRecognitionResultList;
}

// https://wicg.github.io/speech-api/#dictdef-speechrecognitioneventinit
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

// https://wicg.github.io/speech-api/#enumdef-speechrecognitionerrorcode
type SpeechRecognitionErrorCode =
  | "aborted"
  | "audio-capture"
  | "bad-grammar"
  | "language-not-supported"
  | "network"
  | "no-speech"
  | "not-allowed"
  | "service-not-allowed";

// https://wicg.github.io/speech-api/#speechrecognitionerrorevent
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}

interface Window {
  SpeechRecognition: SpeechRecognitionConstructor;
  webkitSpeechRecognition: SpeechRecognitionConstructor;
}

interface Image {
  type: 'image_url' | 'pdf_url';
  image_url?: {
    url: string;
    detail: string;
    size?: number;
  };
  pdf_url?: {
    url: string;
    detail: string;
    size?: number;
  };
  preview?: string;
}

interface File {
  type: 'file_url';
  file_url: {
    url: string;
    detail: string;
  };
  preview: string;
}

interface TextEvent {
  readonly data: string;
}

interface Message {
  role: string;
  content: string | (string | Image)[];
}

interface AudioItem {
  audio: HTMLAudioElement;
  played: boolean;
}

interface AudioFileDict {
  [groupIndex: number]: Record<number, AudioItem>;
}

interface HeaderContent {
  [key: string]: {
    [key: string]: string;
  };
}

interface InternalizationContent {
  [key: string]: {
    [key: string]: string;
  };
}
