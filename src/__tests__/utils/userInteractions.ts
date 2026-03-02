/**
 * User interaction simulation helpers for Editor testing
 */

import userEvent from '@testing-library/user-event';
import { fireEvent, screen, within, waitFor } from '@testing-library/react';

/**
 * Simulate typing in a text field or textarea
 */
export async function typeInEditor(
  element: HTMLElement,
  text: string,
  options?: {
    delay?: number;
    clearFirst?: boolean;
  }
): Promise<void> {
  const user = userEvent.setup({ delay: options?.delay });

  if (options?.clearFirst) {
    await user.clear(element);
  }

  await user.type(element, text);
}

/**
 * Simulate typing in a specific block by index
 */
export async function typeInBlock(
  blockIndex: number,
  text: string,
  options?: { delay?: number; clearFirst?: boolean }
): Promise<void> {
  const blocks = screen.getAllByRole('textbox');
  const block = blocks[blockIndex];

  if (!block) {
    throw new Error(`Block at index ${blockIndex} not found`);
  }

  await typeInEditor(block, text, options);
}

/**
 * Simulate selecting text in an element
 */
export function selectText(element: HTMLElement, start: number, end: number): void {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    element.focus();
    element.setSelectionRange(start, end);
    fireEvent.select(element);
  } else if (element.isContentEditable) {
    const range = document.createRange();
    const textNode = element.firstChild || element;

    if (textNode.nodeType === Node.TEXT_NODE) {
      range.setStart(textNode, start);
      range.setEnd(textNode, Math.min(end, textNode.textContent?.length || 0));
    }

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    fireEvent.select(element);
  }
}

/**
 * Simulate formatting actions (bold, italic, etc.)
 */
export async function applyFormatting(
  element: HTMLElement,
  format: 'bold' | 'italic' | 'underline' | 'code'
): Promise<void> {
  const user = userEvent.setup();

  // Simulate keyboard shortcuts for formatting
  const shortcuts: Record<string, string> = {
    bold: '{Meta>}b{/Meta}',
    italic: '{Meta>}i{/Meta}',
    underline: '{Meta>}u{/Meta}',
    code: '{Meta>}`{/Meta}',
  };

  const shortcut = shortcuts[format];
  if (shortcut) {
    element.focus();
    await user.keyboard(shortcut);
  }
}

/**
 * Simulate clicking a button by its text or role
 */
export async function clickButton(text: string | RegExp): Promise<void> {
  const user = userEvent.setup();
  const button = screen.getByRole('button', { name: text });
  await user.click(button);
}

/**
 * Simulate clicking the save button
 */
export async function clickSave(): Promise<void> {
  await clickButton(/save/i);
}

/**
 * Simulate clicking undo/redo buttons
 */
export async function clickUndo(): Promise<void> {
  await clickButton(/undo/i);
}

export async function clickRedo(): Promise<void> {
  await clickButton(/redo/i);
}

/**
 * Simulate selecting a chapter from dropdown
 */
export async function selectChapter(chapterTitle: string | RegExp): Promise<void> {
  const user = userEvent.setup();

  // Find the chapter selector (assuming it's a select element)
  const selector = screen.getByRole('combobox', { name: /chapter/i });
  await user.click(selector);

  // Select the option
  const option = screen.getByRole('option', { name: chapterTitle });
  await user.click(option);
}

/**
 * Simulate adding a new block
 */
export async function addBlock(): Promise<void> {
  await clickButton(/add.*block/i);
}

/**
 * Simulate removing a block by index
 */
export async function removeBlock(blockIndex: number): Promise<void> {
  const blocks = screen.getAllByRole('textbox');
  const blockContainer = blocks[blockIndex]?.closest('.editor-block');

  if (!blockContainer) {
    throw new Error(`Block at index ${blockIndex} not found`);
  }

  const removeButton = within(blockContainer as HTMLElement).getByRole('button', {
    name: /remove/i,
  });

  const user = userEvent.setup();
  await user.click(removeButton);
}

/**
 * Simulate keyboard navigation
 */
export async function pressKey(key: string, options?: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }): Promise<void> {
  const user = userEvent.setup();

  let keyCombo = '';
  if (options?.ctrl) keyCombo += '{Control>}';
  if (options?.shift) keyCombo += '{Shift>}';
  if (options?.alt) keyCombo += '{Alt>}';
  if (options?.meta) keyCombo += '{Meta>}';

  keyCombo += key;

  if (options?.meta) keyCombo += '{/Meta}';
  if (options?.alt) keyCombo += '{/Alt}';
  if (options?.shift) keyCombo += '{/Shift}';
  if (options?.ctrl) keyCombo += '{/Control}';

  await user.keyboard(keyCombo);
}

/**
 * Simulate Tab key for indentation
 */
export async function pressTab(shift: boolean = false): Promise<void> {
  await pressKey('Tab', { shift });
}

/**
 * Simulate Enter key for new line/block
 */
export async function pressEnter(options?: { ctrl?: boolean; shift?: boolean }): Promise<void> {
  await pressKey('Enter', options);
}

/**
 * Simulate Escape key
 */
export async function pressEscape(): Promise<void> {
  await pressKey('Escape');
}

/**
 * Simulate arrow key navigation
 */
export async function pressArrowKey(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
  const key = direction.charAt(0).toUpperCase() + direction.slice(1);
  await pressKey(`Arrow${key}`);
}

/**
 * Wait for editor content to update
 */
export async function waitForContentUpdate(timeout: number = 1000): Promise<void> {
  await waitFor(() => {
    // Wait for any pending updates
  }, { timeout });
}

/**
 * Get text content from all blocks
 */
export function getAllBlockContents(): string[] {
  const blocks = screen.getAllByRole('textbox');
  return blocks.map(block => {
    if (block instanceof HTMLTextAreaElement || block instanceof HTMLInputElement) {
      return block.value;
    }
    return block.textContent || '';
  });
}

/**
 * Get text content from a specific block
 */
export function getBlockContent(blockIndex: number): string {
  const contents = getAllBlockContents();
  return contents[blockIndex] || '';
}

/**
 * Check if a block exists
 */
export function hasBlock(blockIndex: number): boolean {
  const blocks = screen.queryAllByRole('textbox');
  return blockIndex < blocks.length;
}

/**
 * Get the number of blocks
 */
export function getBlockCount(): number {
  return screen.queryAllByRole('textbox').length;
}

/**
 * Focus on a specific block
 */
export function focusBlock(blockIndex: number): void {
  const blocks = screen.getAllByRole('textbox');
  const block = blocks[blockIndex];

  if (!block) {
    throw new Error(`Block at index ${blockIndex} not found`);
  }

  block.focus();
}

/**
 * Blur (unfocus) the currently focused element
 */
export function blur(): void {
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement) {
    activeElement.blur();
  }
}

/**
 * Simulate copy-paste operations
 */
export async function copyText(element: HTMLElement): Promise<void> {
  element.focus();
  await pressKey('c', { meta: true });
}

export async function cutText(element: HTMLElement): Promise<void> {
  element.focus();
  await pressKey('x', { meta: true });
}

export async function pasteText(element: HTMLElement, text?: string): Promise<void> {
  element.focus();

  if (text) {
    // Simulate clipboard with custom text
    const clipboardEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: new DataTransfer(),
    });

    clipboardEvent.clipboardData?.setData('text/plain', text);
    element.dispatchEvent(clipboardEvent);
  } else {
    // Use keyboard shortcut
    await pressKey('v', { meta: true });
  }
}

/**
 * Simulate drag and drop (for reordering blocks)
 */
export async function dragBlock(fromIndex: number, toIndex: number): Promise<void> {
  const blocks = screen.getAllByRole('textbox');
  const fromBlock = blocks[fromIndex];
  const toBlock = blocks[toIndex];

  if (!fromBlock || !toBlock) {
    throw new Error('Block not found for drag operation');
  }

  fireEvent.dragStart(fromBlock);
  fireEvent.dragEnter(toBlock);
  fireEvent.dragOver(toBlock);
  fireEvent.drop(toBlock);
  fireEvent.dragEnd(fromBlock);
}
