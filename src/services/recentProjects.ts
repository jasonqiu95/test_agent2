/**
 * Service for managing recent projects list
 */

import { RecentProject } from '../types/recentProjects';

const RECENT_PROJECTS_KEY = 'vellum_recent_projects';
const MAX_RECENT_PROJECTS = 10;

export class RecentProjectsService {
  /**
   * Get all recent projects
   */
  getRecentProjects(): RecentProject[] {
    try {
      const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
      if (!stored) return [];

      const projects = JSON.parse(stored) as RecentProject[];
      // Sort by lastOpened descending
      return projects.sort((a, b) =>
        new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime()
      );
    } catch (error) {
      console.error('Error loading recent projects:', error);
      return [];
    }
  }

  /**
   * Add or update a project in recent list
   */
  addRecentProject(project: Omit<RecentProject, 'lastOpened'>): void {
    try {
      const projects = this.getRecentProjects();

      // Remove existing entry if present
      const filtered = projects.filter(p => p.filePath !== project.filePath);

      // Add new entry at the top
      const newProject: RecentProject = {
        ...project,
        lastOpened: new Date().toISOString(),
      };

      filtered.unshift(newProject);

      // Keep only the most recent MAX_RECENT_PROJECTS
      const trimmed = filtered.slice(0, MAX_RECENT_PROJECTS);

      localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error saving recent project:', error);
    }
  }

  /**
   * Remove a project from recent list
   */
  removeRecentProject(filePath: string): void {
    try {
      const projects = this.getRecentProjects();
      const filtered = projects.filter(p => p.filePath !== filePath);
      localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing recent project:', error);
    }
  }

  /**
   * Clear all recent projects
   */
  clearRecentProjects(): void {
    try {
      localStorage.removeItem(RECENT_PROJECTS_KEY);
    } catch (error) {
      console.error('Error clearing recent projects:', error);
    }
  }
}

// Singleton instance
let recentProjectsServiceInstance: RecentProjectsService | null = null;

export function getRecentProjectsService(): RecentProjectsService {
  if (!recentProjectsServiceInstance) {
    recentProjectsServiceInstance = new RecentProjectsService();
  }
  return recentProjectsServiceInstance;
}
