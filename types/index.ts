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
  modelId: Model | string;
  type: 'cover' | 'screen-guard';
  material?: string;
  color?: string;
  price: number;
  images: string[];
  description?: string;
  stockQuantity: number;
  sku: string;
  createdAt: string;
  updatedAt: string;
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