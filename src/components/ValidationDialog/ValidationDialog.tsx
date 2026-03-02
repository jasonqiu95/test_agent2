import React, { useState, useMemo } from 'react';
import type {
  ValidationResult,
  ValidationIssue,
} from '../../services/validator';
import { getValidationSummary } from '../../services/validator';
import './ValidationDialog.css';

export interface ValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed?: () => void;
  validationResult: ValidationResult;
  title?: string;
  canProceedWithWarnings?: boolean;
}

type FilterType = 'all' | 'error' | 'warning' | 'info';

export const ValidationDialog: React.FC<ValidationDialogProps> = ({
  isOpen,
  onClose,
  onProceed,
  validationResult,
  title = 'Validation Results',
  canProceedWithWarnings = false,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  const filteredIssues = useMemo(() => {
    if (filter === 'all') {
      return validationResult.issues;
    }
    return validationResult.issues.filter((issue) => issue.severity === filter);
  }, [validationResult.issues, filter]);

  const canProceed =
    validationResult.valid || (canProceedWithWarnings && validationResult.errors.length === 0);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const toggleIssueExpanded = (issueId: string) => {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  };

  const handleProceed = () => {
    if (onProceed && canProceed) {
      onProceed();
    }
  };

  const summary = getValidationSummary(validationResult);

  return (
    <div
      className="validation-dialog-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="validation-dialog-title"
    >
      <div className="validation-dialog">
        <div className="validation-dialog-header">
          <div className="validation-dialog-title-section">
            <h2 id="validation-dialog-title">{title}</h2>
            <p className="validation-dialog-summary">{summary}</p>
          </div>
          <button
            className="validation-dialog-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="validation-dialog-toolbar">
          <div className="validation-filters">
            <button
              className={`validation-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({validationResult.issues.length})
            </button>
            <button
              className={`validation-filter-btn error ${filter === 'error' ? 'active' : ''}`}
              onClick={() => setFilter('error')}
            >
              Errors ({validationResult.errors.length})
            </button>
            <button
              className={`validation-filter-btn warning ${filter === 'warning' ? 'active' : ''}`}
              onClick={() => setFilter('warning')}
            >
              Warnings ({validationResult.warnings.length})
            </button>
            <button
              className={`validation-filter-btn info ${filter === 'info' ? 'active' : ''}`}
              onClick={() => setFilter('info')}
            >
              Info ({validationResult.info.length})
            </button>
          </div>
        </div>

        <div className="validation-dialog-content">
          {filteredIssues.length === 0 ? (
            <div className="validation-empty">
              <div className="validation-empty-icon">✓</div>
              <p className="validation-empty-message">
                {filter === 'all'
                  ? 'No issues found. Your book is ready for export!'
                  : `No ${filter} issues found.`}
              </p>
            </div>
          ) : (
            <div className="validation-issues-list">
              {filteredIssues.map((issue) => (
                <ValidationIssueCard
                  key={issue.id}
                  issue={issue}
                  isExpanded={expandedIssues.has(issue.id)}
                  onToggleExpand={toggleIssueExpanded}
                />
              ))}
            </div>
          )}
        </div>

        <div className="validation-dialog-footer">
          {!validationResult.valid && (
            <div className="validation-footer-message">
              {validationResult.errors.length > 0 && (
                <span className="validation-footer-error">
                  ⚠ Must fix {validationResult.errors.length} error
                  {validationResult.errors.length !== 1 ? 's' : ''} before export
                </span>
              )}
            </div>
          )}
          <div className="validation-footer-buttons">
            <button className="validation-btn-secondary" onClick={onClose}>
              Close
            </button>
            {onProceed && (
              <button
                className="validation-btn-primary"
                onClick={handleProceed}
                disabled={!canProceed}
                title={
                  canProceed
                    ? 'Proceed with export'
                    : 'Fix all errors before proceeding'
                }
              >
                {canProceed ? 'Proceed with Export' : 'Cannot Export'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ValidationIssueCardProps {
  issue: ValidationIssue;
  isExpanded: boolean;
  onToggleExpand: (issueId: string) => void;
}

const ValidationIssueCard: React.FC<ValidationIssueCardProps> = ({
  issue,
  isExpanded,
  onToggleExpand,
}) => {
  const severityIcon = {
    error: '⨯',
    warning: '⚠',
    info: 'ⓘ',
  };

  const handleCardClick = () => {
    if (issue.details || issue.location) {
      onToggleExpand(issue.id);
    }
  };

  const hasExpandableContent = Boolean(issue.details || issue.location);

  return (
    <div
      className={`validation-issue-card ${issue.severity} ${
        isExpanded ? 'expanded' : ''
      } ${hasExpandableContent ? 'expandable' : ''}`}
      onClick={handleCardClick}
      role={hasExpandableContent ? 'button' : undefined}
      tabIndex={hasExpandableContent ? 0 : undefined}
      onKeyDown={
        hasExpandableContent
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleExpand(issue.id);
              }
            }
          : undefined
      }
    >
      <div className="validation-issue-header">
        <div className="validation-issue-icon">{severityIcon[issue.severity]}</div>
        <div className="validation-issue-main">
          <div className="validation-issue-title">
            <span className="validation-issue-category">{issue.category}</span>
            {issue.location && (
              <span className="validation-issue-location">in {issue.location}</span>
            )}
          </div>
          <p className="validation-issue-message">{issue.message}</p>
        </div>
        {hasExpandableContent && (
          <div className="validation-issue-expand-icon">
            {isExpanded ? '▼' : '▶'}
          </div>
        )}
      </div>

      {isExpanded && (issue.details || issue.location) && (
        <div className="validation-issue-details">
          {issue.details && <p className="validation-issue-details-text">{issue.details}</p>}
        </div>
      )}
    </div>
  );
};
