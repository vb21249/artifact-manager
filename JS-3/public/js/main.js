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
    
    // Public API
    return {
        // Models
        models: {
            artifact: ArtifactModel,
            category: CategoryModel
        },
        
        // API Service
        api: ApiService,
        
        // UI Components
        ui: UI,
        
        // Utils
        utils: Utils,
        
        // Initialization
        init,
        
        // Getters for drag and drop
        getDraggedItem: () => draggedItem,
        getDraggedItemType: () => draggedItemType,
        
        // Setters for drag and drop
        setDraggedItem: (item, type) => {
            draggedItem = item;
            draggedItemType = type;
        },
        
        // Data loading methods
        loadCategories,
        loadArtifacts,
        
        // Artifact methods
        createArtifact: async (artifactData) => {
            try {
                const artifact = await ApiService.artifacts.create(artifactData);
                ArtifactModel.add(artifact);
                UI.artifacts.render();
                return artifact;
            } catch (error) {
                Utils.showError('Failed to create artifact.');
                throw error;
            }
        },
        
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
                const category = await ApiService.categories.create(categoryData);
                CategoryModel.add(category);
                UI.categories.render();
                return category;
            } catch (error) {
                Utils.showError('Failed to create category.');
                throw error;
            }
        },
        
        updateCategory: async (categoryId, categoryData) => {
            try {
                console.log(`Updating category ${categoryId} with data:`, categoryData);
                const updatedCategory = await ApiService.categories.update(categoryId, categoryData);
                
                if (updatedCategory) {
                    // Update the category in the model
                    CategoryModel.update(updatedCategory);
                    // Re-render the categories tree
                    UI.categories.render();
                    console.log('Category updated successfully');
                    return updatedCategory;
                } else {
                    throw new Error('Failed to update category');
                }
            } catch (error) {
                console.error('Error updating category:', error);
                Utils.showError('Failed to update category.');
                throw error;
            }
        },
        
        deleteCategory: async (categoryId) => {
            try {
                const success = await ApiService.categories.delete(categoryId);
                if (success) {
                    CategoryModel.remove(categoryId);
                    UI.categories.render();
                }
                return success;
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
            document.getElementById('url').value = artifact.url || '';
            document.getElementById('docType').value = artifact.documentationType || '';
            document.getElementById('author').value = artifact.author || '';
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
            
            // Populate parent category select
            UI.forms.populateCategorySelects();
            
            // Update modal title
            document.getElementById('categoryModalTitle').textContent = 'Add New Category';
            
            // Show modal
            document.getElementById('categoryModal').style.display = 'block';
        },
        
        showEditCategoryForm: (categoryId) => {
            console.log(`Showing edit form for category ${categoryId}`);
            
            const category = CategoryModel.getById(categoryId);
            if (!category) {
                console.error(`Category ${categoryId} not found in model`);
                return;
            }
            
            console.log('Category data:', category);
            
            // Populate form
            document.getElementById('categoryId').value = category.id;
            document.getElementById('categoryName').value = category.name || '';
            
            // Populate parent category select
            UI.forms.populateCategorySelects();
            document.getElementById('parentCategorySelect').value = category.parentCategoryId || '';
            
            // Update modal title
            document.getElementById('categoryModalTitle').textContent = 'Edit Category';
            
            // Show modal directly
            document.getElementById('categoryModal').style.display = 'block';
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
                console.log(`Showing details for artifact ${artifactId}`);
                // First ensure the artifact is in the model
                let artifact = ArtifactModel.getById(artifactId);
                
                if (!artifact) {
                    console.log(`Artifact ${artifactId} not in model, fetching from API`);
                    // Fetch from API if not in model
                    artifact = await ApiService.artifacts.getById(artifactId);
                    if (artifact) {
                        // Add to model if found
                        ArtifactModel.add(artifact);
                    }
                }
                
                if (!artifact) {
                    throw new Error(`Artifact ${artifactId} not found`);
                }
                
                await UI.artifacts.showDetails(artifactId);
            } catch (error) {
                console.error(`Error showing artifact details:`, error);
                Utils.showError('Failed to load artifact details.');
            }
        }
    };
})();

// Make App globally accessible
window.App = App;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', App.init);

export default App;
