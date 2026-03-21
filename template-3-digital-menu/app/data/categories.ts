export const categoriesConfig: Record<string, { tabs: string[], filters: string[] }> = {
    "Food": {
        tabs: ["Starters", "Mains", "Desserts", "Salads", "Soups"],
        filters: ["ALL", "VEG", "NON-VEG"]
    },
    "Drinks": {
        tabs: ["Cocktails", "Mocktails", "Brewed drinks", "Hard Liquor", "Beer"],
        filters: ["ALCOHOLIC", "NON-ALCOHOLIC"]
    },
    "Tobacco": {
        tabs: ["Cigars", "Hookah", "Cigarettes"],
        filters: ["ALL"]
    }
};

export const popularSearchesByCat: Record<string, string[]> = {
    "Food": ["Galouti kebab", "Saffron biryani", "Truffle naan", "Dal bhukara"],
    "Drinks": ["Pina colada", "Beer", "Cosmopolitan", "Margarita", "Red wine"],
    "Tobacco": ["Cigars", "Hookah", "Cigarettes"]
};

export const mainCategories = [
    { name: "Food", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80" },
    { name: "Drinks", img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=200&q=80" },
    { name: "Tobacco", img: "https://images.unsplash.com/photo-1527067829737-402993088e6b?w=200&q=80" }
];
