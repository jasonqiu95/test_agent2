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

export {
  validateBook,
  getValidationSummary,
} from './validator'
export type {
  ValidationIssue,
  ValidationResult,
  ValidationOptions,
  ValidationSeverity,
} from './validator'
