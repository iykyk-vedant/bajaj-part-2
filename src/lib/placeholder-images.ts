import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// Convert string array to ImagePlaceholder objects
const stringArray: string[] = data.placeholderImages;
export const PlaceHolderImages: ImagePlaceholder[] = stringArray.map((url, index) => ({
  id: `placeholder-${index}`,
  description: `Placeholder image ${index + 1}`,
  imageUrl: url,
  imageHint: `Image ${index + 1} from storage`
}));
