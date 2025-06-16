import type { Product, Category } from '@/types';
import { Rocket, Bomb, Sparkles, Disc3, Gift, Smile } from 'lucide-react';

export const categories: Category[] = [
  { id: 'sky-shots', name: 'Sky Shots / Aerials', icon: Rocket, slug: 'sky-shots' },
  { id: 'ground-crackers', name: 'Ground Crackers', icon: Bomb, slug: 'ground-crackers' },
  { id: 'sparklers', name: 'Sparklers', icon: Sparkles, slug: 'sparklers' },
  { id: 'spinning-crackers', name: 'Spinning Crackers', icon: Disc3, slug: 'spinning-crackers' },
  { id: 'fancy-novelty', name: 'Fancy / Novelty', icon: Gift, slug: 'fancy-novelty' },
  { id: 'kids-special', name: 'Kids Special', icon: Smile, slug: 'kids-special' },
];

export const products: Product[] = [
  // Sky Shots
  {
    id: 'sky1',
    name: '7 Shots Peacock',
    description: 'Colorful peacock pattern bursting in the sky. A true spectacle.',
    price: 15.99,
    category: 'Sky Shots / Aerials',
    imageUrl: 'https://placehold.co/400x300.png',
    imageHint: 'fireworks aerial',
    rating: 4.5,
    stock: 50,
  },
  {
    id: 'sky2',
    name: '3 Sound Rocket',
    description: 'Rocket that goes up with three distinct sound effects.',
    price: 8.50,
    category: 'Sky Shots / Aerials',
    imageUrl: 'https://placehold.co/400x300.png',
    imageHint: 'fireworks rocket',
    rating: 4.2,
    stock: 100,
  },
  {
    id: 'sky3',
    name: 'Flower Pots Shot',
    description: 'Aerial shot that blooms like a flower pot in the sky.',
    price: 12.00,
    category: 'Sky Shots / Aerials',
    imageUrl: 'https://placehold.co/400x300.png',
    imageHint: 'aerial fireworks display',
    rating: 4.0,
    stock: 70,
  },

  // Ground Crackers
  {
    id: 'ground1',
    name: 'Lakshmi Crackers (2 sound)',
    description: 'Classic Lakshmi crackers with a double bang.',
    price: 5.00,
    category: 'Ground Crackers',
    imageUrl: 'https://placehold.co/400x300.png',
    imageHint: 'firecrackers ground',
    rating: 4.0,
    stock: 200,
  },
  {
    id: 'ground2',
    name: 'Atom Bomb',
    description: 'Loud and powerful atom bomb cracker for a big bang.',
    price: 3.99,
    category: 'Ground Crackers',
    imageUrl: 'https://placehold.co/400x300.png',
    imageHint: 'large firecracker',
    rating: 4.7,
    stock: 150,
  },

  // Sparklers
  {
    id: 'spark1',
    name: 'Colour Sparkler (10 inch)',
    description: '10-inch sparklers producing vibrant colored sparks.',
    price: 2.50,
    category: 'Sparklers',
    imageUrl: 'https://placehold.co/400x300.png',
    imageHint: 'sparklers colorful',
    rating: 4.3,
    stock: 300,
  },
  {
    id: 'spark2',
    name: 'Electric Sparkler',
    description: 'Unique electric-like crackling sparks.',
    price: 3.00,
    category: 'Sparklers',
    imageUrl: 'https://placehold.co/400x300.png',
    imageHint: 'electric sparkler',
    rating: 4.1,
    stock: 120,
  },

  // Spinning Crackers
  {
    id: 'spin1',
    name: 'Chakkaram (Ground Wheel)',
    description: 'Classic ground wheel spinning with sparks.',
    price: 1.99,
    category: 'Spinning Crackers',
    imageUrl: 'https://placehold.co/400x300.png',
    imageHint: 'spinning firework',
    rating: 3.9,
    stock: 250,
  },
  {
    id: 'spin2',
    name: 'Colour Chakkaram',
    description: 'Ground wheel that spins with multi-colored sparks.',
    price: 2.75,
    category: 'Spinning Crackers',
    imageUrl: 'https://placehold.co/400x300.png',
    imageHint: 'colorful ground spinner',
    rating: 4.0,
    stock: 180,
  },
  
  // Fancy / Novelty Crackers
  {
    id: 'fancy1',
    name: 'Cartoon Shot',
    description: 'Fun novelty cracker that displays cartoon characters.',
    price: 4.50,
    category: 'Fancy / Novelty',
    imageUrl: 'https://placehold.co/400x300.png',
    imageHint: 'novelty firework',
    rating: 3.8,
    stock: 90,
  },
  {
    id: 'fancy2',
    name: 'Butterflies',
    description: 'Crackers that fly around like butterflies with colorful trails.',
    price: 5.20,
    category: 'Fancy / Novelty',
    imageUrl: 'https://placehold.co/400x300.png',
    imageHint: 'butterfly firework',
    rating: 4.2,
    stock: 110,
  },

  // Kids Special
  {
    id: 'kids1',
    name: 'Magic Pop (Pop Pop)',
    description: 'Safe and fun pop-pop snappers for kids.',
    price: 1.00,
    category: 'Kids Special',
    imageUrl: 'https://placehold.co/400x300.png',
    imageHint: 'kids party poppers',
    rating: 4.6,
    stock: 500,
  },
  {
    id: 'kids2',
    name: 'Pencil Crackers',
    description: 'Small, pencil-shaped crackers, easy for kids to handle.',
    price: 1.50,
    category: 'Kids Special',
    imageUrl: 'https://placehold.co/400x300.png',
    imageHint: 'small fireworks',
    rating: 4.0,
    stock: 280,
  },
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const getProductsByCategory = (categorySlug: string): Product[] => {
  const category = categories.find(c => c.slug === categorySlug);
  if (!category) return [];
  return products.filter(p => p.category === category.name);
};
