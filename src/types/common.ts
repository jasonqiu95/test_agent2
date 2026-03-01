/**
 * Common types and metadata structures
 */

export interface Metadata {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
  tags?: string[];
  custom?: Record<string, unknown>;
}

export interface Position {
  line?: number;
  column?: number;
  offset?: number;
}

export interface Location {
  start: Position;
  end: Position;
}
