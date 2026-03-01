import React, { useState, useEffect } from 'react';
import { RecentProject, SampleProject } from '../../types/recentProjects';
import { getRecentProjectsService } from '../../services/recentProjects';
import { getPersistenceService } from '../../services/persistence';
import type { Book } from '../../types/book';
import './WelcomeScreen.css';

export interface WelcomeScreenProps {
  onProjectOpen: (project: Book, filePath: string) => void;
  onNewProject: () => void;
  onImportProject: () => void;
}

const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 'sample-novel',
    name: 'Sample Novel',
    description: 'A complete novel template with chapters, front matter, and back matter',
    thumbnail: '📖',
    templateData: null,
  },
  {
    id: 'sample-poetry',
    name: 'Poetry Collection',
    description: 'Template for a poetry collection with sections',
    thumbnail: '✍️',
    templateData: null,
  },
  {
    id: 'sample-technical',
    name: 'Technical Book',
    description: 'Template for technical documentation and guides',
    thumbnail: '💻',
    templateData: null,
  },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onProjectOpen,
  onNewProject,
  onImportProject,
}) => {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [showTips, setShowTips] = useState(true);

  useEffect(() => {
    const recentProjectsService = getRecentProjectsService();
    setRecentProjects(recentProjectsService.getRecentProjects());
  }, []);

  const handleOpenRecent = async (project: RecentProject) => {
    const persistenceService = getPersistenceService();
    const result = await persistenceService.loadProject(project.filePath);

    if (result.success && result.project) {
      onProjectOpen(result.project.book, project.filePath);
    } else {
      // If file not found or error, show alert and remove from recent
      alert(`Could not open project: ${result.error || 'Unknown error'}`);
      const recentProjectsService = getRecentProjectsService();
      recentProjectsService.removeRecentProject(project.filePath);
      setRecentProjects(recentProjectsService.getRecentProjects());
    }
  };

  const handleOpenExisting = async () => {
    const persistenceService = getPersistenceService();
    const result = await persistenceService.openProject();

    if (result.success && result.project) {
      const filePath = result.project.metadata.filePath || '';
      onProjectOpen(result.project.book, filePath);
    }
  };

  const handleRemoveRecent = (filePath: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const recentProjectsService = getRecentProjectsService();
    recentProjectsService.removeRecentProject(filePath);
    setRecentProjects(recentProjectsService.getRecentProjects());
  };

  const handleOpenSample = (sample: SampleProject) => {
    // Create a sample book based on the template
    const sampleBook: Book = createSampleBook(sample);
    onProjectOpen(sampleBook, '');
  };

  const formatLastOpened = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-header">
        <h1 className="welcome-title">Welcome to Vellum</h1>
        <p className="welcome-subtitle">Professional book publishing software</p>
      </div>

      <div className="welcome-content">
        <div className="welcome-main">
          {/* Quick Actions */}
          <section className="welcome-actions">
            <button className="action-button action-button-primary" onClick={onImportProject}>
              <span className="action-icon">📥</span>
              <div className="action-content">
                <span className="action-title">Import Document</span>
                <span className="action-description">Import from Word, DOCX, or other formats</span>
              </div>
            </button>

            <button className="action-button" onClick={handleOpenExisting}>
              <span className="action-icon">📂</span>
              <div className="action-content">
                <span className="action-title">Open Existing</span>
                <span className="action-description">Open a .vellum project file</span>
              </div>
            </button>

            <button className="action-button" onClick={onNewProject}>
              <span className="action-icon">✨</span>
              <div className="action-content">
                <span className="action-title">New Project</span>
                <span className="action-description">Start with a blank project</span>
              </div>
            </button>
          </section>

          {/* Recent Projects */}
          {recentProjects.length > 0 && (
            <section className="welcome-section">
              <h2 className="section-title">Recent Projects</h2>
              <div className="recent-projects-grid">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="recent-project-card"
                    onClick={() => handleOpenRecent(project)}
                  >
                    <button
                      className="recent-project-remove"
                      onClick={(e) => handleRemoveRecent(project.filePath, e)}
                      aria-label="Remove from recent"
                      title="Remove from recent"
                    >
                      ×
                    </button>
                    <div className="recent-project-thumbnail">
                      {project.thumbnail || '📄'}
                    </div>
                    <div className="recent-project-info">
                      <h3 className="recent-project-title">{project.title}</h3>
                      {project.authors && project.authors.length > 0 && (
                        <p className="recent-project-authors">
                          {project.authors.join(', ')}
                        </p>
                      )}
                      <div className="recent-project-meta">
                        <span className="recent-project-date">
                          {formatLastOpened(project.lastOpened)}
                        </span>
                        {project.wordCount && (
                          <span className="recent-project-words">
                            {project.wordCount.toLocaleString()} words
                          </span>
                        )}
                        {project.status && (
                          <span className={`recent-project-status status-${project.status}`}>
                            {project.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sample Projects */}
          <section className="welcome-section">
            <h2 className="section-title">Sample Projects</h2>
            <p className="section-description">
              Explore sample templates to get started quickly
            </p>
            <div className="sample-projects-grid">
              {SAMPLE_PROJECTS.map((sample) => (
                <div
                  key={sample.id}
                  className="sample-project-card"
                  onClick={() => handleOpenSample(sample)}
                >
                  <div className="sample-project-thumbnail">{sample.thumbnail}</div>
                  <div className="sample-project-info">
                    <h3 className="sample-project-title">{sample.name}</h3>
                    <p className="sample-project-description">{sample.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Quick Start Tips */}
        {showTips && (
          <aside className="welcome-sidebar">
            <div className="tips-card">
              <div className="tips-header">
                <h3 className="tips-title">Quick Start Tips</h3>
                <button
                  className="tips-close"
                  onClick={() => setShowTips(false)}
                  aria-label="Close tips"
                >
                  ×
                </button>
              </div>
              <ul className="tips-list">
                <li className="tip-item">
                  <span className="tip-icon">💡</span>
                  <div className="tip-content">
                    <strong>Import your manuscript</strong>
                    <p>Drag and drop DOCX files or use the Import button</p>
                  </div>
                </li>
                <li className="tip-item">
                  <span className="tip-icon">⌨️</span>
                  <div className="tip-content">
                    <strong>Keyboard shortcuts</strong>
                    <p>Press Ctrl/Cmd + / to see all available shortcuts</p>
                  </div>
                </li>
                <li className="tip-item">
                  <span className="tip-icon">💾</span>
                  <div className="tip-content">
                    <strong>Auto-save enabled</strong>
                    <p>Your work is automatically saved to .vellum files</p>
                  </div>
                </li>
                <li className="tip-item">
                  <span className="tip-icon">🎨</span>
                  <div className="tip-content">
                    <strong>Customize styles</strong>
                    <p>Define paragraph and character styles for consistency</p>
                  </div>
                </li>
                <li className="tip-item">
                  <span className="tip-icon">📚</span>
                  <div className="tip-content">
                    <strong>Organize chapters</strong>
                    <p>Use front matter, chapters, and back matter sections</p>
                  </div>
                </li>
              </ul>
            </div>
          </aside>
        )}
      </div>

      <footer className="welcome-footer">
        <p className="welcome-footer-text">
          Version 1.0.0 | © 2026 Vellum Publishing
        </p>
      </footer>
    </div>
  );
};

// Helper function to create sample books
function createSampleBook(sample: SampleProject): Book {
  const bookId = `sample-${Date.now()}`;
  const now = new Date();

  const baseBook: Book = {
    id: bookId,
    createdAt: now,
    updatedAt: now,
    title: sample.name,
    authors: [
      {
        id: `author-${Date.now()}`,
        name: 'Sample Author',
        role: 'author',
      },
    ],
    frontMatter: [],
    chapters: [],
    backMatter: [],
    styles: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      description: sample.description,
      language: 'en',
    },
    status: 'draft',
  };

  // Customize based on sample type
  if (sample.id === 'sample-novel') {
    baseBook.chapters = createSampleChapters(3);
  } else if (sample.id === 'sample-poetry') {
    baseBook.chapters = createSamplePoetryChapters();
  } else if (sample.id === 'sample-technical') {
    baseBook.chapters = createSampleTechnicalChapters();
  }

  return baseBook;
}

function createSampleChapters(count: number): any[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => ({
    id: `chapter-${i + 1}`,
    createdAt: now,
    updatedAt: now,
    title: `Chapter ${i + 1}`,
    number: i + 1,
    content: [],
  }));
}

function createSamplePoetryChapters(): any[] {
  const now = new Date();
  return [
    {
      id: 'section-1',
      createdAt: now,
      updatedAt: now,
      title: 'Spring Poems',
      number: 1,
      content: [],
    },
  ];
}

function createSampleTechnicalChapters(): any[] {
  const now = new Date();
  return [
    {
      id: 'chapter-intro',
      createdAt: now,
      updatedAt: now,
      title: 'Introduction',
      number: 1,
      content: [],
    },
    {
      id: 'chapter-getting-started',
      createdAt: now,
      updatedAt: now,
      title: 'Getting Started',
      number: 2,
      content: [],
    },
  ];
}
