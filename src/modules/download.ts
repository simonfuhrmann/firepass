// Code to open the download dialog client-side. Inspired by
// https://github.com/eligrey/FileSaver.js/blob/master/src/FileSaver.js

// Initiates a client download of the provided blob object.
export function downloadBlob(blob: Blob, filename: string) {
  const element = document.createElement('a');
  element.download = filename;
  element.rel = 'noopener';  // Prevent tabnabbing.
  element.href = URL.createObjectURL(blob);

  // Click the element to start the download.
  setTimeout(() => element.click(), 0);

  // Immediately deleting the Object URL will lead to a failed download.
  // A timeout of 0 appears to work in Chrome. Not tested in other browsers.
  setTimeout(() => URL.revokeObjectURL(element.href), 30 * 1000);
}

// Initiates a client download of the provided text string.
export function downloadText(text: string, filename: string) {
  const arrayBuffer = new TextEncoder().encode(text);
  const blob = new Blob([arrayBuffer]);
  downloadBlob(blob, filename);
}
