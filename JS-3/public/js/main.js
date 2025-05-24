// Main application entry point
import ArtifactModel from './models/artifact.js';
import CategoryModel from './models/category.js';
import ApiService from './services/api.js';
import UI from './components/ui.js';
import EventHandlers from './handlers/events.js';
import Utils from './utils/helpers.js';

// Main application object
const App = (() => {
    // Global state for drag and drop
    let draggedItem = null;
    let draggedItemType = null; // 'artifact' or 'category'
    
    // Initialize the application
    const init = async () => {
        try {
            // Fetch initial data
            await Promise.all([
                loadCategories(),
                loadArtifacts()
            ]);
            
            // Render UI
            UI.categories.render();
            UI.artifacts.render();
            UI.forms.populateFilters();
            
            // Set up event listeners
            EventHandlers.setupEventListeners();
        } catch (error) {
            console.error('Initialization error:', error);
            Utils.showError('Failed to initialize the application. Please try refreshing the page.');
        }
    };
    
    // Load categories from API
    const loadCategories = async () => {
        const categories = await ApiService.categories.getAll();
        CategoryModel.setCategories(categories);
        return categories;
    };
    
    // Load artifacts from API
    const loadArtifacts = async () => {
        const artifacts = await ApiService.artifacts.getAll();
        ArtifactModel.setArtifacts(artifacts);
        return artifacts;
    };
    
    // Public methods
    return {
        // Initialize the app
        init,
        
        // Models
        models: {
            artifact: ArtifactModel,
            category: CategoryModel
        },
        
        // Services
        api: ApiService,
        
        // UI components
        ui: UI,
        
        // Utilities
        utils: Utils,
        
        // Global state
        get draggedItem() { return draggedItem; },
        set draggedItem(item) { draggedItem = item; },
        get draggedItemType() { return draggedItemType; },
        set draggedItemType(type) { draggedItemType = type; },
        
        // Category operations
        selectCategory: (categoryId) => {
            CategoryModel.setSelected(categoryId);
            
            // Update UI
            document.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            const selectedItem = document.querySelector(`.category-item[data-id="${categoryId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected');
            }
            
            UI.artifacts.render();
        },
        
        createCategory: async (categoryData) => {
            try {
                const newCategory = await ApiService.categories.create(categoryData);
                await loadCategories(); // Refresh to get proper hierarchy
                UI.categories.render();
                return newCategory;
            } catch (error) {
                Utils.showError('Failed to create category.');
                throw error;
            }
        },
        
        updateCategory: async (id, categoryData) => {
            try {
                const updatedCategory = await ApiService.categories.update(id, categoryData);
                await loadCategories(); // Refresh to get proper hierarchy
                UI.categories.render();
                return updatedCategory;
            } catch (error) {
                Utils.showError('Failed to update category.');
                throw error;
            }
        },
        
        deleteCategory: async (id) => {
            try {
                await ApiService.categories.delete(id);
                await loadCategories(); // Refresh to get proper hierarchy
                CategoryModel.setSelected(null);
                UI.categories.render();
                UI.artifacts.render();
                return true;
            } catch (error) {
                Utils.showError('Failed to delete category.');
                throw error;
            }
        },
        
        moveCategory: async (id, newParentId, position) => {
            try {
                await ApiService.categories.move(id, newParentId, position);
                await loadCategories(); // Refresh to get proper hierarchy
                UI.categories.render();
                return true;
            } catch (error) {
                Utils.showError('Failed to move category.');
                throw error;
            }
        },
        
        // Artifact operations
        selectArtifact: (artifactId) => {
            ArtifactModel.setSelected(artifactId);
            
            // Update UI
            document.querySelectorAll('.artifact-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            const selectedItem = document.querySelector(`.artifact-item[data-id="${artifactId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected');
            }
        },
        
        createArtifact: async (artifactData) => {
            try {
                console.log("Artifact date to save:", artifactData);
                const newArtifact = await ApiService.artifacts.create(artifactData);
                ArtifactModel.add(newArtifact);
                UI.artifacts.render();
                UI.forms.populateFilters();
                return newArtifact;
            } catch (error) {
                Utils.showError('Failed to create artifact.');
                throw error;
            }
        },
        
        updateArtifact: async (id, artifactData) => {
            try {
                const updatedArtifact = await ApiService.artifacts.update(id, artifactData);
                ArtifactModel.update(id, updatedArtifact);
                UI.artifacts.render();
                UI.forms.populateFilters();
                return updatedArtifact;
            } catch (error) {
                Utils.showError('Failed to update artifact.');
                throw error;
            }
        },
        
        deleteArtifact: async (id) => {
            try {
                await ApiService.artifacts.delete(id);
                ArtifactModel.remove(id);
                UI.artifacts.render();
                UI.forms.populateFilters();
                return true;
            } catch (error) {
                Utils.showError('Failed to delete artifact.');
                throw error;
            }
        },
        
        moveArtifact: async (id, newCategoryId, position) => {
            try {
                await ApiService.artifacts.move(id, newCategoryId, position);
                await loadArtifacts(); // Refresh to get updated positions
                UI.artifacts.render();
                return true;
            } catch (error) {
                Utils.showError('Failed to move artifact.');
                throw error;
            }
        },
        
        addArtifactVersion: async (artifactId, versionData) => {
            try {
                return await ApiService.artifacts.addVersion(artifactId, versionData);
            } catch (error) {
                Utils.showError('Failed to add version.');
                throw error;
            }
        },
        
        // Form handling
        showNewArtifactForm: () => {
            // Reset form
            document.getElementById('artifactForm').reset();
            document.getElementById('artifactId').value = '';
            document.getElementById('modalTitle').textContent = 'Add New Artifact';
            
            // Populate category select
            UI.forms.populateCategorySelects();
            
            // Set default category if one is selected
            if (CategoryModel.getSelected()) {
                document.getElementById('categorySelect').value = CategoryModel.getSelected();
            }
            
            // Show modal
            UI.modals.show(document.getElementById('artifactModal'));
        },
        
        showEditArtifactForm: (artifact) => {
            // Hide details modal
            UI.modals.hide(document.getElementById('artifactDetailsModal'));
            
            // Populate form
            document.getElementById('artifactId').value = artifact.id;
            document.getElementById('title').value = artifact.title || '';
            document.getElementById('description').value = artifact.description || '';
            document.getElementById('version').value = artifact.currentVersion || '';
            document.getElementById('language').value = artifact.programmingLanguage || '';
            document.getElementById('framework').value = artifact.framework || '';
            document.getElementById('license').value = artifact.licenseType || '';
            
            // Populate category select
            UI.forms.populateCategorySelects();
            document.getElementById('categorySelect').value = artifact.categoryId || '';
            
            // Update modal title
            document.getElementById('modalTitle').textContent = 'Edit Artifact';
            
            // Show modal
            UI.modals.show(document.getElementById('artifactModal'));
        },
        
        showNewCategoryForm: () => {
            // Reset form
            document.getElementById('categoryForm').reset();
            document.getElementById('categoryId').value = '';
            document.getElementById('categoryModalTitle').textContent = 'Add New Category';
            
            // Populate parent category select
            UI.forms.populateCategorySelects();
            
            // Set default parent if a category is selected
            if (CategoryModel.getSelected()) {
                document.getElementById('parentCategorySelect').value = CategoryModel.getSelected();
            }
            
            // Show modal
            UI.modals.show(document.getElementById('categoryModal'));
        },
        
        showEditCategoryForm: (categoryId) => {
            const category = CategoryModel.getById(categoryId);
            if (!category) return;
            
            // Populate form
            document.getElementById('categoryId').value = category.id;
            document.getElementById('categoryName').value = category.name || '';
            
            // Populate parent category select
            UI.forms.populateCategorySelects();
            document.getElementById('parentCategorySelect').value = category.parentCategoryId || '';
            
            // Update modal title
            document.getElementById('categoryModalTitle').textContent = 'Edit Category';
            
            // Show modal
            UI.modals.show(document.getElementById('categoryModal'));
        },
        
        showAddVersionForm: (artifactId) => {
            // Hide details modal
            UI.modals.hide(document.getElementById('artifactDetailsModal'));
            
            // Reset form
            document.getElementById('versionForm').reset();
            document.getElementById('versionArtifactId').value = artifactId;
            
            // Show modal
            UI.modals.show(document.getElementById('versionModal'));
        },
        
        showArtifactDetails: async (artifactId) => {
            try {
                await UI.artifacts.showDetails(artifactId);
            } catch (error) {
                Utils.showError('Failed to load artifact details.');
            }
        }
    };
})();

// Make App globally available
window.App = App;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', App.init);
