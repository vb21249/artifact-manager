interface Category {
  id: number;
  name: string;
  parentCategoryId: number | null;
  position: number;
  path: string;
  subcategories: Category[];
  artifactsCount: number;
}

interface CreateCategoryDto {
  name: string;
  parentCategoryId?: number;
}

interface UpdateCategoryDto {
  name: string;
}

interface RearrangeCategoryDto {
  newPosition: number;
}

const API_BASE_URL = 'http://localhost:8080/api';

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return response.json();
  },

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create category');
    }
    return response.json();
  },

  async updateCategory(id: number, data: UpdateCategoryDto): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update category');
    }
  },

  async deleteCategory(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete category');
    }
  },

  async rearrangeCategory(id: number, data: RearrangeCategoryDto): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}/position`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to rearrange category');
    }
  },
};

export type { Category, CreateCategoryDto, UpdateCategoryDto, RearrangeCategoryDto };
