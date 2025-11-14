export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Model {
  _id: string;
  name: string;
  slug: string;
  brandId: Brand | string;
  image?: string;
  releaseYear?: number;
  specifications?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  models: (string | Model)[]; // Can be populated or just IDs
  type: 'cover' | 'screen-guard';
  material?: string;
  color?: string;
  price: number;
  images: string[];
  description?: string;
  stockQuantity: number;
  sku: string;
  createdAt?: string; // Add this for sorting by date
  updatedAt?: string; // Add this for sorting by date
}

export interface SearchResults {
  query: string;
  totalResults: number;
  results: {
    brands: Brand[];
    models: Model[];
    products: Product[];
  };
}