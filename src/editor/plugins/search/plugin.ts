/**
 * ProseMirror search plugin with state management
 * Provides search functionality with automatic match updates on document changes
 */

import { Plugin, PluginKey, EditorState, Transaction } from 'prosemirror-state';
import { SearchPluginState, SearchQuery, SearchMatch } from './types';
import { searchDocument } from './algorithm';

/**
 * Plugin key for accessing search plugin state
 */
export const searchPluginKey = new PluginKey<SearchPluginState>('search');

/**
 * Metadata keys for search transactions
 */
const SEARCH_META = {
  SET_QUERY: 'setSearchQuery',
  SET_OPTIONS: 'setSearchOptions',
  NEXT_MATCH: 'nextMatch',
  PREV_MATCH: 'prevMatch',
  CLEAR_SEARCH: 'clearSearch',
};

/**
 * Creates an initial empty search state
 */
function createInitialState(): SearchPluginState {
  return {
    query: null,
    options: {
      caseSensitive: false,
      regex: false,
      wholeWord: false,
    },
    matches: [],
    currentMatchIndex: -1,
  };
}

/**
 * Performs search on the document and returns updated state
 */
function performSearch(
  doc: any,
  query: SearchQuery | null,
  currentMatchIndex: number
): { matches: SearchMatch[]; currentMatchIndex: number } {
  if (!query || !query.query || query.query.trim() === '') {
    return {
      matches: [],
      currentMatchIndex: -1,
    };
  }

  const matches = searchDocument(doc, query);

  // Adjust current match index if needed
  let newIndex = currentMatchIndex;
  if (matches.length === 0) {
    newIndex = -1;
  } else if (currentMatchIndex >= matches.length) {
    newIndex = matches.length - 1;
  } else if (currentMatchIndex < -1) {
    newIndex = -1;
  }

  return { matches, currentMatchIndex: newIndex };
}

/**
 * Creates the search plugin
 */
export function createSearchPlugin(): Plugin<SearchPluginState> {
  return new Plugin<SearchPluginState>({
    key: searchPluginKey,

    /**
     * Initialize plugin state with empty search
     */
    state: {
      init(): SearchPluginState {
        return createInitialState();
      },

      /**
       * Apply method handles state updates
       * Automatically re-runs search when document changes or query updates
       */
      apply(tr: Transaction, oldState: SearchPluginState, _oldEditorState: EditorState, newEditorState: EditorState): SearchPluginState {
        // Check for search-specific metadata
        const setQuery = tr.getMeta(SEARCH_META.SET_QUERY) as SearchQuery | undefined;
        const setOptions = tr.getMeta(SEARCH_META.SET_OPTIONS) as Partial<SearchPluginState['options']> | undefined;
        const nextMatch = tr.getMeta(SEARCH_META.NEXT_MATCH) as boolean | undefined;
        const prevMatch = tr.getMeta(SEARCH_META.PREV_MATCH) as boolean | undefined;
        const clearSearch = tr.getMeta(SEARCH_META.CLEAR_SEARCH) as boolean | undefined;

        // Handle clear search
        if (clearSearch) {
          return createInitialState();
        }

        // Handle query update
        if (setQuery !== undefined) {
          const newQuery: SearchQuery = {
            query: setQuery.query,
            caseSensitive: setQuery.caseSensitive !== undefined ? setQuery.caseSensitive : oldState.options.caseSensitive,
            regex: setQuery.regex !== undefined ? setQuery.regex : oldState.options.regex,
            wholeWord: setQuery.wholeWord !== undefined ? setQuery.wholeWord : oldState.options.wholeWord,
          };

          const { matches, currentMatchIndex } = performSearch(
            newEditorState.doc,
            newQuery,
            0 // Reset to first match when query changes
          );

          return {
            query: newQuery,
            options: {
              caseSensitive: newQuery.caseSensitive,
              regex: newQuery.regex,
              wholeWord: newQuery.wholeWord,
            },
            matches,
            currentMatchIndex,
          };
        }

        // Handle options update
        if (setOptions !== undefined) {
          const newOptions = {
            ...oldState.options,
            ...setOptions,
          };

          let newQuery = oldState.query;
          if (newQuery) {
            newQuery = {
              ...newQuery,
              caseSensitive: newOptions.caseSensitive,
              regex: newOptions.regex,
              wholeWord: newOptions.wholeWord,
            };
          }

          const { matches, currentMatchIndex } = performSearch(
            newEditorState.doc,
            newQuery,
            oldState.currentMatchIndex
          );

          return {
            query: newQuery,
            options: newOptions,
            matches,
            currentMatchIndex: matches.length > 0 && oldState.matches.length === 0 ? 0 : currentMatchIndex,
          };
        }

        // Handle next match navigation
        if (nextMatch && oldState.matches.length > 0) {
          const newIndex = (oldState.currentMatchIndex + 1) % oldState.matches.length;
          return {
            ...oldState,
            currentMatchIndex: newIndex,
          };
        }

        // Handle previous match navigation
        if (prevMatch && oldState.matches.length > 0) {
          const newIndex = oldState.currentMatchIndex <= 0
            ? oldState.matches.length - 1
            : oldState.currentMatchIndex - 1;
          return {
            ...oldState,
            currentMatchIndex: newIndex,
          };
        }

        // Handle document changes - re-run search automatically
        if (tr.docChanged && oldState.query) {
          const { matches, currentMatchIndex } = performSearch(
            newEditorState.doc,
            oldState.query,
            oldState.currentMatchIndex
          );

          return {
            ...oldState,
            matches,
            currentMatchIndex,
          };
        }

        // No changes
        return oldState;
      },
    },
  });
}

/**
 * Transaction creators for updating search state
 */

/**
 * Creates a transaction to set the search query
 */
export function setSearchQuery(state: EditorState, query: string, options?: Partial<SearchQuery>): Transaction {
  const tr = state.tr;
  const searchQuery: SearchQuery = {
    query,
    caseSensitive: options?.caseSensitive ?? false,
    regex: options?.regex ?? false,
    wholeWord: options?.wholeWord ?? false,
  };
  tr.setMeta(SEARCH_META.SET_QUERY, searchQuery);
  return tr;
}

/**
 * Creates a transaction to update search options
 */
export function setSearchOptions(
  state: EditorState,
  options: Partial<SearchPluginState['options']>
): Transaction {
  const tr = state.tr;
  tr.setMeta(SEARCH_META.SET_OPTIONS, options);
  return tr;
}

/**
 * Creates a transaction to navigate to the next match
 */
export function nextMatch(state: EditorState): Transaction {
  const tr = state.tr;
  tr.setMeta(SEARCH_META.NEXT_MATCH, true);
  return tr;
}

/**
 * Creates a transaction to navigate to the previous match
 */
export function prevMatch(state: EditorState): Transaction {
  const tr = state.tr;
  tr.setMeta(SEARCH_META.PREV_MATCH, true);
  return tr;
}

/**
 * Creates a transaction to clear the search
 */
export function clearSearch(state: EditorState): Transaction {
  const tr = state.tr;
  tr.setMeta(SEARCH_META.CLEAR_SEARCH, true);
  return tr;
}

/**
 * State getters for accessing current search state
 */

/**
 * Gets the current search plugin state
 */
export function getSearchState(state: EditorState): SearchPluginState | undefined {
  return searchPluginKey.getState(state);
}

/**
 * Gets the current search query
 */
export function getCurrentQuery(state: EditorState): SearchQuery | null {
  const searchState = getSearchState(state);
  return searchState?.query ?? null;
}

/**
 * Gets all current matches
 */
export function getMatches(state: EditorState): SearchMatch[] {
  const searchState = getSearchState(state);
  return searchState?.matches ?? [];
}

/**
 * Gets the currently active match
 */
export function getCurrentMatch(state: EditorState): SearchMatch | null {
  const searchState = getSearchState(state);
  if (!searchState || searchState.currentMatchIndex === -1) {
    return null;
  }
  return searchState.matches[searchState.currentMatchIndex] ?? null;
}

/**
 * Gets the index of the currently active match
 */
export function getCurrentMatchIndex(state: EditorState): number {
  const searchState = getSearchState(state);
  return searchState?.currentMatchIndex ?? -1;
}

/**
 * Gets the total number of matches
 */
export function getMatchCount(state: EditorState): number {
  const searchState = getSearchState(state);
  return searchState?.matches.length ?? 0;
}

/**
 * Gets the current search options
 */
export function getSearchOptions(state: EditorState): SearchPluginState['options'] {
  const searchState = getSearchState(state);
  return searchState?.options ?? {
    caseSensitive: false,
    regex: false,
    wholeWord: false,
  };
}

/**
 * Checks if search is currently active
 */
export function isSearchActive(state: EditorState): boolean {
  const searchState = getSearchState(state);
  return !!(searchState?.query?.query);
}
