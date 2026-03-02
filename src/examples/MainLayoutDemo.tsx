import React, { useState } from 'react';
import { MainLayout } from '../components/MainLayout';
import './MainLayoutDemo.css';

export const MainLayoutDemo: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const navigatorContent = (
    <div className="demo-panel">
      <h2>Navigator</h2>
      <div className="demo-panel-content">
        <div className="demo-tree">
          <div className="demo-tree-item">
            <span className="demo-tree-icon">📁</span> Project
          </div>
          <div className="demo-tree-item demo-tree-item-nested">
            <span className="demo-tree-icon">📁</span> Chapters
          </div>
          <div className="demo-tree-item demo-tree-item-nested-2">
            <span className="demo-tree-icon">📄</span> Chapter 1: Introduction
          </div>
          <div className="demo-tree-item demo-tree-item-nested-2">
            <span className="demo-tree-icon">📄</span> Chapter 2: The Journey Begins
          </div>
          <div className="demo-tree-item demo-tree-item-nested-2">
            <span className="demo-tree-icon">📄</span> Chapter 3: Rising Action
          </div>
          <div className="demo-tree-item demo-tree-item-nested">
            <span className="demo-tree-icon">📁</span> Resources
          </div>
          <div className="demo-tree-item demo-tree-item-nested-2">
            <span className="demo-tree-icon">🖼️</span> Cover Art
          </div>
          <div className="demo-tree-item demo-tree-item-nested-2">
            <span className="demo-tree-icon">📊</span> Research Notes
          </div>
        </div>
      </div>
    </div>
  );

  const editorContent = (
    <div className="demo-panel demo-editor-panel">
      <div className="demo-editor-header">
        <h2>Editor</h2>
        <button className="demo-theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? '🌙' : '☀️'} Toggle Theme
        </button>
      </div>
      <div className="demo-panel-content">
        <div className="demo-editor-area">
          <h3 className="demo-chapter-title">Chapter 1: Introduction</h3>
          <div className="demo-editor-text">
            <p>
              The morning sun cast long shadows across the ancient library, its golden
              rays illuminating countless rows of leather-bound volumes. Each book held
              secrets waiting to be discovered, stories yearning to be told.
            </p>
            <p>
              Sarah ran her fingers along the spines, feeling the texture of centuries
              beneath her touch. This was where she belonged, surrounded by the wisdom
              of ages and the promise of new adventures hidden between yellowed pages.
            </p>
            <p>
              Little did she know that the book she was about to pull from the shelf
              would change everything she thought she knew about the world.
            </p>
          </div>
          <div className="demo-editor-stats">
            <span>Words: 89</span>
            <span>Characters: 567</span>
            <span>Reading time: ~30s</span>
          </div>
        </div>
      </div>
    </div>
  );

  const previewContent = (
    <div className="demo-panel">
      <h2>Preview</h2>
      <div className="demo-panel-content">
        <div className="demo-preview-area">
          <div className="demo-preview-page">
            <div className="demo-preview-header">Chapter 1</div>
            <h3 className="demo-preview-title">Introduction</h3>
            <div className="demo-preview-text">
              <p>
                The morning sun cast long shadows across the ancient library, its
                golden rays illuminating countless rows of leather-bound volumes. Each
                book held secrets waiting to be discovered, stories yearning to be
                told.
              </p>
              <p>
                Sarah ran her fingers along the spines, feeling the texture of
                centuries beneath her touch. This was where she belonged, surrounded by
                the wisdom of ages and the promise of new adventures hidden between
                yellowed pages.
              </p>
              <p>
                Little did she know that the book she was about to pull from the shelf
                would change everything she thought she knew about the world.
              </p>
            </div>
            <div className="demo-preview-footer">Page 1</div>
          </div>
        </div>
        <div className="demo-preview-controls">
          <button>◀ Previous</button>
          <span>Page 1 of 1</span>
          <button>Next ▶</button>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout
      navigator={navigatorContent}
      editor={editorContent}
      preview={previewContent}
    />
  );
};
