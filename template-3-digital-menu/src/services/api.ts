// src/services/api.ts

const BASE_URL = "/api/csat";

export const csatApi = {
  getMenu: async (outletId: string, restaurantId: string, posCode: string) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Menu/GetMenuJson?outletId=${outletId}&restaurantid=${restaurantId}&poscode=${posCode}`
      );
      if (!response.ok) throw new Error("API Phat gayi bhai!");
      return await response.json();
    } catch (error) {
      console.error("CSAT API Error:", error);
      throw error;
    }
  }
};