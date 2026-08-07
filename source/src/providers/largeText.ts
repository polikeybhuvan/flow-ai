export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * Inserts a potentially very large amount of text into
 * a textarea/contenteditable in smaller chunks.
 *
 * This is much more reliable than trying to insert
 * a 100KB+ conversation in one browser event.
 */
export async function insertLargeText(
    editor: HTMLElement,
    text: string,
    chunkSize = 8000
): Promise<boolean> {
    if (!text) {
        return false;
    }

    editor.focus();

    /*
     * TEXTAREA
     */
    if (
        editor instanceof
        HTMLTextAreaElement
    ) {
        const prototype =
            HTMLTextAreaElement.prototype;

        const descriptor =
            Object.getOwnPropertyDescriptor(
                prototype,
                "value"
            );

        if (!descriptor?.set) {
            return false;
        }

        /*
         * Clear existing content first.
         */
        descriptor.set.call(
            editor,
            ""
        );

        editor.dispatchEvent(
            new Event("input", {
                bubbles: true,
            })
        );

        for (
            let start = 0;
            start < text.length;
            start += chunkSize
        ) {
            const chunk =
                text.slice(
                    start,
                    start + chunkSize
                );

            const current =
                editor.value;

            descriptor.set.call(
                editor,
                current + chunk
            );

            editor.dispatchEvent(
                new InputEvent("input", {
                    bubbles: true,
                    inputType:
                        "insertText",
                    data: chunk,
                })
            );

            /*
             * Give the framework a chance to
             * process the input.
             */
            await sleep(10);
        }

        editor.dispatchEvent(
            new Event("change", {
                bubbles: true,
            })
        );

        return (
            editor.value.length >=
            text.length * 0.95
        );
    }

    /*
     * CONTENTEDITABLE
     */

    const selection =
        globalThis.getSelection?.();

    if (!selection) {
        return false;
    }

    /*
     * Clear existing content.
     */
    const clearRange =
        document.createRange();

    clearRange.selectNodeContents(
        editor
    );

    selection.removeAllRanges();
    selection.addRange(
        clearRange
    );

    try {
        document.execCommand(
            "delete",
            false
        );
    } catch {
        editor.textContent = "";
    }

    /*
     * Move cursor to the end.
     */
    const endRange =
        document.createRange();

    endRange.selectNodeContents(
        editor
    );

    endRange.collapse(false);

    selection.removeAllRanges();
    selection.addRange(
        endRange
    );

    /*
     * Insert the conversation in chunks.
     */
    for (
        let start = 0;
        start < text.length;
        start += chunkSize
    ) {
        const chunk =
            text.slice(
                start,
                start + chunkSize
            );

        /*
         * Make sure the cursor remains
         * at the end before every chunk.
         */
        const currentSelection =
            globalThis.getSelection?.();

        if (currentSelection) {
            const range =
                document.createRange();

            range.selectNodeContents(
                editor
            );

            range.collapse(false);

            currentSelection.removeAllRanges();

            currentSelection.addRange(
                range
            );
        }

        let inserted = false;

        try {
            inserted =
                document.execCommand(
                    "insertText",
                    false,
                    chunk
                );
        } catch (error) {
            console.warn(
                "FlowAI: chunk insertion failed",
                error
            );
        }

        /*
         * Fallback for browsers/frameworks
         * that reject execCommand.
         */
        if (!inserted) {
            try {
                const inputEvent =
                    new InputEvent(
                        "beforeinput",
                        {
                            bubbles: true,
                            cancelable: true,
                            inputType:
                                "insertText",
                            data: chunk,
                        }
                    );

                editor.dispatchEvent(
                    inputEvent
                );

                editor.dispatchEvent(
                    new InputEvent(
                        "input",
                        {
                            bubbles: true,
                            cancelable: true,
                            inputType:
                                "insertText",
                            data: chunk,
                        }
                    )
                );
            } catch (error) {
                console.warn(
                    "FlowAI: input event fallback failed",
                    error
                );
            }
        }

        await sleep(20);
    }

    /*
     * Final input event.
     */
    editor.dispatchEvent(
        new InputEvent("input", {
            bubbles: true,
            inputType: "insertText",
            data: "",
        })
    );

    await sleep(300);

    const result =
        editor.innerText ||
        editor.textContent ||
        "";

    console.log(
        "FlowAI: inserted characters:",
        result.length,
        "/",
        text.length
    );

    /*
     * Allow a little tolerance because rich editors
     * can normalize whitespace.
     */
    return (
        result.trim().length >=
        text.trim().length * 0.95
    );
}