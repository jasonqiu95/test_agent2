export { PersistenceService, getPersistenceService } from './persistence'
export type {
  VellumProject,
  SaveResult,
  LoadResult,
  ProjectInfo,
} from './persistence'

export {
  StyleService,
  getStyleService,
  applyStyleToBook,
  generateStylePreview,
} from './styleService'
export type {
  StyleApplicationResult,
  StylePreview,
} from './styleService'
