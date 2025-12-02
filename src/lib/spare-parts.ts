
import data from './spare-parts.json';

export type SparePart = {
  code: string;
  description: string;
};

export const spareParts: SparePart[] = data.spareParts;
