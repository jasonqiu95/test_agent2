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
  saveCustomStyle,
  loadCustomStyles,
  updateCustomStyle,
  deleteCustomStyle,
  getAllStyles,
} from './styleService'
export type {
  StyleApplicationResult,
  StylePreview,
} from './styleService'
