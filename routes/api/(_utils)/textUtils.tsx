/**
 * Converts a DOI string to a URL.
 * @param doi - The DOI string to convert
 * @returns The URL for the DOI
 */
export function convertDoiToUrl(doi: string): string {
  const cleanDoi = doi.replace(/^DOI:\s*/, '');
  return cleanDoi === 'null' ? '#' : `https://doi.org/${cleanDoi}`;
}

/**
 * Renders text with links and bold formatting.
 * @param text - The text to process
 * @returns Array of processed text parts
 */
export function renderTextWithLinksAndBold(text: string) {
  const parts = text.split(/((?:\*\*.*?\*\*)|(?:https?:\/\/[^\s]+)|(?:www\.[^\s]+)|(?:DOI:\s*(?:null|[\d.]+\/[^\s]+))|(?:(?<![\w/])\b10\.\d+\/[^\s]+))/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    } else if (part.startsWith('DOI:') || part.match(/^10\.\d+\//)) {
      return (
        <a
          key={index}
          href={convertDoiToUrl(part)}
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-600 hover:text-blue-800 underline"
        >
          {part}
        </a>
      );
    } else if (part.startsWith('http://') || part.startsWith('https://') || part.startsWith('www.')) {
      const url = part.startsWith('www.') ? `https://${part}` : part;
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-600 hover:text-blue-800 underline"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}