interface SpeakIconProps {
  isPlaying: boolean;
}

export default function SpeakIcon({ isPlaying }: SpeakIconProps) {
  return isPlaying ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style="margin-left: 0.5rem; width: 24px; height: 24px;"
      viewBox="0 -960 960 960"
      fill="currentColor"
    >
      <title>Speak</title>
      <path d="M320-320h320v-320H320v320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style="margin-left: 0.5rem; width: 24px; height: 24px;"
      viewBox="0 -960 960 960"
      fill="currentColor"
    >
      <title>Speak</title>
      <path d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320ZM400-606l-86 86H200v80h114l86 86v-252ZM300-480Z" />
    </svg>
  );
}