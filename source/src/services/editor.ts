export type EditorElement = HTMLTextAreaElement | HTMLElement;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function waitForEditor(
  selectors: string[],
  timeoutMs = 15000
): Promise<EditorElement | null> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    for (const selector of selectors) {
      const candidates = Array.from(document.querySelectorAll(selector));

      for (const candidate of candidates) {
        const element = candidate as EditorElement;
        const rect = element.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0;

        if (visible) return element;
      }
    }

    await sleep(250);
  }

  return null;
}

function setNativeValue(element: HTMLTextAreaElement, value: string) {
  const prototype = Object.getPrototypeOf(element) as HTMLTextAreaElement;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
}

function dispatchInput(element: HTMLElement, text: string) {
  element.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: text,
    })
  );
}

function dispatchPaste(element: HTMLElement, text: string): boolean {
  try {
    const transfer = new DataTransfer();
    transfer.setData("text/plain", text);
    transfer.setData("text/html", text.replace(/\n/g, "<br>"));

    const event = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData: transfer,
    });

    return element.dispatchEvent(event);
  } catch {
    return false;
  }
}

export async function insertText(
  editor: EditorElement,
  text: string
): Promise<boolean> {
  editor.focus();

  if (editor instanceof HTMLTextAreaElement) {
    setNativeValue(editor, text);
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    editor.dispatchEvent(new Event("change", { bubbles: true }));
    return editor.value === text;
  }

  const editable = editor as HTMLElement;

  // ProseMirror and several modern editors handle a paste event better than
  // direct DOM mutation. Supplying an actual DataTransfer is important.
  const pasted = dispatchPaste(editable, text);
  if (pasted && editable.textContent?.trim() === text.trim()) {
    return true;
  }

  // Try the browser editing command. This triggers the browser's editing
  // pipeline instead of merely changing the DOM tree.
  try {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editable);
    selection?.removeAllRanges();
    selection?.addRange(range);

    if (document.execCommand("insertText", false, text)) {
      dispatchInput(editable, text);
      return true;
    }
  } catch {
    // Fall through to the DOM/input fallback.
  }

  editable.textContent = text;
  dispatchInput(editable, text);

  return editable.textContent?.trim() === text.trim();
}
