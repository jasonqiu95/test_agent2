/**
 * Mock helpers for contentEditable behavior and DOM Selection API
 */

/**
 * Mock the Selection API for testing
 */
export function mockSelection() {
  const originalGetSelection = window.getSelection;

  let mockSelectionData: {
    anchorNode: Node | null;
    anchorOffset: number;
    focusNode: Node | null;
    focusOffset: number;
    isCollapsed: boolean;
    rangeCount: number;
    type: string;
  } = {
    anchorNode: null,
    anchorOffset: 0,
    focusNode: null,
    focusOffset: 0,
    isCollapsed: true,
    rangeCount: 0,
    type: 'None',
  };

  const mockRanges: Range[] = [];

  const mockSelectionObj = {
    get anchorNode() {
      return mockSelectionData.anchorNode;
    },
    get anchorOffset() {
      return mockSelectionData.anchorOffset;
    },
    get focusNode() {
      return mockSelectionData.focusNode;
    },
    get focusOffset() {
      return mockSelectionData.focusOffset;
    },
    get isCollapsed() {
      return mockSelectionData.isCollapsed;
    },
    get rangeCount() {
      return mockRanges.length;
    },
    get type() {
      return mockSelectionData.type;
    },

    getRangeAt(index: number): Range {
      return mockRanges[index];
    },

    addRange(range: Range): void {
      mockRanges.push(range);
      mockSelectionData.rangeCount = mockRanges.length;
      mockSelectionData.type = 'Range';
    },

    removeRange(range: Range): void {
      const index = mockRanges.indexOf(range);
      if (index > -1) {
        mockRanges.splice(index, 1);
      }
      mockSelectionData.rangeCount = mockRanges.length;
    },

    removeAllRanges(): void {
      mockRanges.length = 0;
      mockSelectionData.rangeCount = 0;
      mockSelectionData.type = 'None';
      mockSelectionData.isCollapsed = true;
    },

    collapse(node: Node | null, offset?: number): void {
      mockSelectionData.anchorNode = node;
      mockSelectionData.focusNode = node;
      mockSelectionData.anchorOffset = offset || 0;
      mockSelectionData.focusOffset = offset || 0;
      mockSelectionData.isCollapsed = true;
      mockSelectionData.type = node ? 'Caret' : 'None';
    },

    setPosition(node: Node | null, offset?: number): void {
      this.collapse(node, offset);
    },

    selectAllChildren(node: Node): void {
      mockSelectionData.anchorNode = node;
      mockSelectionData.focusNode = node;
      mockSelectionData.anchorOffset = 0;
      mockSelectionData.focusOffset = node.childNodes.length;
      mockSelectionData.isCollapsed = false;
      mockSelectionData.type = 'Range';
    },

    toString(): string {
      if (mockRanges.length > 0) {
        return mockRanges[0].toString();
      }
      return '';
    },

    // Helper method to set mock data for testing
    __setMockData(data: Partial<typeof mockSelectionData>): void {
      Object.assign(mockSelectionData, data);
    },
  } as Selection;

  window.getSelection = jest.fn(() => mockSelectionObj);

  return {
    restore: () => {
      window.getSelection = originalGetSelection;
    },
    getMockSelection: () => mockSelectionObj,
    setSelection: (data: Partial<typeof mockSelectionData>) => {
      Object.assign(mockSelectionData, data);
    },
  };
}

/**
 * Mock document.execCommand for formatting operations
 */
export function mockExecCommand() {
  const originalExecCommand = document.execCommand;
  const commandHistory: Array<{ command: string; value?: string }> = [];

  document.execCommand = jest.fn((command: string, showUI?: boolean, value?: string) => {
    commandHistory.push({ command, value });
    return true;
  }) as any;

  return {
    restore: () => {
      document.execCommand = originalExecCommand;
    },
    getCommandHistory: () => commandHistory,
    clearHistory: () => {
      commandHistory.length = 0;
    },
    wasCommandCalled: (command: string) => {
      return commandHistory.some(item => item.command === command);
    },
  };
}

/**
 * Create a mock contentEditable element
 */
export function createMockContentEditable(content: string = ''): HTMLDivElement {
  const div = document.createElement('div');
  div.contentEditable = 'true';
  div.textContent = content;
  document.body.appendChild(div);

  return div;
}

/**
 * Mock Range API
 */
export function createMockRange(
  startContainer: Node,
  startOffset: number,
  endContainer?: Node,
  endOffset?: number
): Range {
  const range = document.createRange();

  range.setStart(startContainer, startOffset);
  if (endContainer && endOffset !== undefined) {
    range.setEnd(endContainer, endOffset);
  } else {
    range.setEnd(startContainer, startOffset);
  }

  return range;
}

/**
 * Set text selection in an element
 */
export function setTextSelection(
  element: HTMLElement,
  start: number,
  end?: number
): void {
  const textNode = element.firstChild || element.appendChild(document.createTextNode(''));

  if (textNode.nodeType !== Node.TEXT_NODE) {
    throw new Error('Element does not contain a text node');
  }

  const range = createMockRange(
    textNode,
    start,
    textNode,
    end !== undefined ? end : start
  );

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  element.focus();
}

/**
 * Get the current text selection
 */
export function getTextSelection(): {
  text: string;
  start: number;
  end: number;
} | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  return {
    text: range.toString(),
    start: range.startOffset,
    end: range.endOffset,
  };
}

/**
 * Mock clipboard API
 */
export function mockClipboard() {
  const clipboardData: Record<string, string> = {};

  const mockClipboardAPI = {
    writeText: jest.fn(async (text: string) => {
      clipboardData['text/plain'] = text;
    }),
    readText: jest.fn(async () => {
      return clipboardData['text/plain'] || '';
    }),
    write: jest.fn(async (data: ClipboardItem[]) => {
      // Simplified mock
    }),
    read: jest.fn(async () => {
      return [] as ClipboardItem[];
    }),
  };

  Object.defineProperty(navigator, 'clipboard', {
    value: mockClipboardAPI,
    writable: true,
    configurable: true,
  });

  return {
    getClipboardData: () => clipboardData,
    setClipboardData: (mimeType: string, data: string) => {
      clipboardData[mimeType] = data;
    },
    clear: () => {
      Object.keys(clipboardData).forEach(key => delete clipboardData[key]);
    },
  };
}

/**
 * Simulate input event in contentEditable
 */
export function simulateInput(
  element: HTMLElement,
  data: string,
  inputType: string = 'insertText'
): void {
  const event = new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    data,
    inputType,
  });

  element.dispatchEvent(event);
}

/**
 * Simulate beforeinput event
 */
export function simulateBeforeInput(
  element: HTMLElement,
  data: string,
  inputType: string = 'insertText'
): boolean {
  const event = new InputEvent('beforeinput', {
    bubbles: true,
    cancelable: true,
    data,
    inputType,
  });

  return element.dispatchEvent(event);
}

/**
 * Simulate composition events (for IME input)
 */
export function simulateComposition(
  element: HTMLElement,
  data: string
): void {
  // compositionstart
  const startEvent = new CompositionEvent('compositionstart', {
    bubbles: true,
    cancelable: true,
    data: '',
  });
  element.dispatchEvent(startEvent);

  // compositionupdate
  const updateEvent = new CompositionEvent('compositionupdate', {
    bubbles: true,
    cancelable: true,
    data,
  });
  element.dispatchEvent(updateEvent);

  // compositionend
  const endEvent = new CompositionEvent('compositionend', {
    bubbles: true,
    cancelable: true,
    data,
  });
  element.dispatchEvent(endEvent);
}

/**
 * Mock MutationObserver for testing
 */
export function mockMutationObserver() {
  const observers: Array<{
    callback: MutationCallback;
    target: Node | null;
    options: MutationObserverInit | null;
  }> = [];

  class MockMutationObserver implements MutationObserver {
    private callback: MutationCallback;
    private target: Node | null = null;
    private options: MutationObserverInit | null = null;

    constructor(callback: MutationCallback) {
      this.callback = callback;
      observers.push({
        callback,
        target: this.target,
        options: this.options,
      });
    }

    observe(target: Node, options?: MutationObserverInit): void {
      this.target = target;
      this.options = options || null;
    }

    disconnect(): void {
      this.target = null;
    }

    takeRecords(): MutationRecord[] {
      return [];
    }
  }

  const original = window.MutationObserver;
  (window as any).MutationObserver = MockMutationObserver;

  return {
    restore: () => {
      window.MutationObserver = original;
    },
    getObservers: () => observers,
    trigger: (mutations: MutationRecord[]) => {
      observers.forEach(({ callback }) => {
        callback(mutations, new MockMutationObserver(() => {}));
      });
    },
  };
}

/**
 * Clean up all contentEditable elements created during tests
 */
export function cleanupContentEditableElements(): void {
  const editables = document.querySelectorAll('[contenteditable="true"]');
  editables.forEach(el => el.remove());
}

/**
 * Setup all contentEditable mocks at once
 */
export function setupContentEditableMocks() {
  const selectionMock = mockSelection();
  const execCommandMock = mockExecCommand();
  const clipboardMock = mockClipboard();
  const mutationObserverMock = mockMutationObserver();

  return {
    selection: selectionMock,
    execCommand: execCommandMock,
    clipboard: clipboardMock,
    mutationObserver: mutationObserverMock,
    cleanup: () => {
      selectionMock.restore();
      execCommandMock.restore();
      mutationObserverMock.restore();
      cleanupContentEditableElements();
    },
  };
}
