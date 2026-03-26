import { apiClient } from "@/lib/api-client";

export interface ItemCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  keywords: string[];
  is_prohibited: boolean;
  requires_review: boolean;
  parent_id?: string;
}

export const categoriesApi = {
  // Get all categories
  getAll: async (): Promise<ItemCategory[]> => {
    const response = await apiClient.get("categories");
    return response.data.data.categories || [];
  },

  // Get category by ID
  getById: async (id: string): Promise<ItemCategory> => {
    const response = await apiClient.get(`categories/${id}`);
    return response.data.data;
  }
};