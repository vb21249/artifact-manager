// Category model functions
const CategoryModel = (() => {
    // Private variables
    let categories = [];
    let flattenedCategories = []; // Flattened version for easier querying
    let selectedCategoryId = null;
    
    // Helper to flatten the hierarchical structure
    const flattenCategories = (cats, result = []) => {
        cats.forEach(category => {
            result.push({
                id: category.id,
                name: category.name,
                parentCategoryId: category.parentCategoryId,
                position: category.position,
                path: category.path
            });
            
            if (category.subcategories && category.subcategories.length > 0) {
                flattenCategories(category.subcategories, result);
            }
        });
        return result;
    };
    
    // Public methods
    return {
        getAll: () => flattenedCategories,
        
        getSelected: () => selectedCategoryId,
        
        setSelected: (id) => {
            selectedCategoryId = id;
            return selectedCategoryId;
        },
        
        setCategories: (data) => {
            categories = data;
            flattenedCategories = flattenCategories(data);
            console.log('Flattened categories:', flattenedCategories);
            return categories;
        },
        
        getById: (id) => flattenedCategories.find(c => c.id === id),
        
        getRootCategories: () => categories,
        
        getChildCategories: (parentId) => {
            const parent = categories.find(c => c.id === parentId);
            return parent && parent.subcategories ? parent.subcategories : 
                   flattenedCategories.filter(c => c.parentCategoryId === parentId);
        },
        
        hasChildren: (categoryId) => {
            // First check in the original hierarchical structure
            const category = categories.find(c => c.id === categoryId);
            if (category && category.subcategories && category.subcategories.length > 0) {
                return true;
            }
            
            // Then check in the flattened structure
            return flattenedCategories.some(c => c.parentCategoryId === categoryId);
        },
        
        add: (category) => {
            flattenedCategories.push(category);
            return category;
        },
        
        update: (id, updatedCategory) => {
            const index = flattenedCategories.findIndex(c => c.id === id);
            if (index !== -1) {
                flattenedCategories[index] = updatedCategory;
            }
            return updatedCategory;
        },
        
        remove: (id) => {
            flattenedCategories = flattenedCategories.filter(c => c.id !== id);
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
                const category = flattenedCategories.find(c => c.id === current);
                current = category ? category.parentCategoryId : null;
            }
            
            return false;
        },
        
        // Get the full path of a category
        getCategoryPath: (categoryId) => {
            const path = [];
            let currentCategory = categories.find(c => c.id === categoryId);
            
            // If category doesn't exist, return empty path
            if (!currentCategory) return path;
            
            // Add the current category to the path
            path.unshift(currentCategory.name);
            
            // Traverse up the parent chain
            while (currentCategory.parentCategoryId) {
                const parentCategory = categories.find(c => c.id === currentCategory.parentCategoryId);
                if (!parentCategory) break;
                
                path.unshift(parentCategory.name);
                currentCategory = parentCategory;
            }
            
            return path;
        },
    };
})();

export default CategoryModel;
