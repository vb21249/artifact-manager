// Category model functions
const CategoryModel = (() => {
    // Private variables
    let categories = [];
    let selectedCategoryId = null;
    
    // Public methods
    return {
        getAll: () => categories,
        getSelected: () => selectedCategoryId,
        setSelected: (id) => {
            selectedCategoryId = id;
            return selectedCategoryId;
        },
        setCategories: (data) => {
            categories = data;
            return categories;
        },
        getById: (id) => categories.find(c => c.id === id),
        getRootCategories: () => categories.filter(c => !c.parentCategoryId),
        getChildCategories: (parentId) => categories.filter(c => c.parentCategoryId === parentId),
        hasChildren: (categoryId) => categories.some(c => c.parentCategoryId === categoryId),
        add: (category) => {
            categories.push(category);
            return category;
        },
        update: (id, updatedCategory) => {
            const index = categories.findIndex(c => c.id === id);
            if (index !== -1) {
                categories[index] = updatedCategory;
            }
            return updatedCategory;
        },
        remove: (id) => {
            categories = categories.filter(c => c.id !== id);
            return true;
        },
        isDescendant: (potentialParentId, categoryId) => {
            // Check if potentialParentId is a descendant of categoryId
            let current = potentialParentId;
            const visited = new Set();
            
            while (current) {
                if (current === categoryId) return true;
                if (visited.has(current)) return false; // Prevent infinite loops
                
                visited.add(current);
                const category = categories.find(c => c.id === current);
                current = category ? category.parentCategoryId : null;
            }
            
            return false;
        }
    };
})();

export default CategoryModel;
