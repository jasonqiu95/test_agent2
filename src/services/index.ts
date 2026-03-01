export { PersistenceService, getPersistenceService } from './persistence'
export type {
  VellumProject,
  SaveResult,
  LoadResult,
  ProjectInfo,
} from './persistence'

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
