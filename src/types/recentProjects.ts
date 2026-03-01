/**
 * Recent projects tracking types
 */

export interface RecentProject {
  id: string;
  filePath: string;
  title: string;
  lastOpened: string;
  thumbnail?: string;
  authors?: string[];
  status?: 'draft' | 'review' | 'published' | 'archived';
  wordCount?: number;
}

export interface SampleProject {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  templateData: unknown;
}
