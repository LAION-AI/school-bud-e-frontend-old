export function customJsx(type: any, props: any, ...children: any[]) {
  const filePath = import.meta.url; // Get the file path of this module
  return h(
    type,
    {
      ...props,
      "data-file-path": filePath, // Inject file path
    },
    ...children,
  );
}
