// Event handlers for user interactions
const EventHandlers = (() => {
    // Form elements
    const artifactForm = document.getElementById('artifactForm');
    const categoryForm = document.getElementById('categoryForm');
    const versionForm = document.getElementById('versionForm');
    
    // Search and filter elements
    const searchInput = document.getElementById('searchInput');
    const languageFilter = document.getElementById('languageFilter');
    const frameworkFilter = document.getElementById('frameworkFilter');
    const licenseFilter = document.getElementById('licenseFilter');
    
    // Buttons
    const newCategoryBtn = document.getElementById('newCategoryBtn');
    const newArtifactBtn = document.getElementById('newArtifactBtn');
    
    return {
        setupEventListeners: () => {
            // New buttons
            newCategoryBtn.addEventListener('click', App.showNewCategoryForm);
            newArtifactBtn.addEventListener('click', App.showNewArtifactForm);
            
            // Close modal buttons
            document.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', () => {
                    App.ui.modals.hideAll();
                });
            });
            
            // Cancel buttons
            document.getElementById('cancelArtifactBtn').addEventListener('click', () => {
                App.ui.modals.hide(document.getElementById('artifactModal'));
            });
            
            document.getElementById('cancelCategoryBtn').addEventListener('click', () => {
                App.ui.modals.hide(document.getElementById('categoryModal'));
            });
            
            document.getElementById('cancelVersionBtn').addEventListener('click', () => {
                App.ui.modals.hide(document.getElementById('versionModal'));
            });
            
            // Form submissions
            artifactForm.addEventListener('submit', EventHandlers.handleArtifactFormSubmit);
            categoryForm.addEventListener('submit', EventHandlers.handleCategoryFormSubmit);
            versionForm.addEventListener('submit', EventHandlers.handleVersionFormSubmit);
            
            // Search and filters
            searchInput.addEventListener('input', App.ui.artifacts.render);
            languageFilter.addEventListener('change', App.ui.artifacts.render);
            frameworkFilter.addEventListener('change', App.ui.artifacts.render);
            licenseFilter.addEventListener('change', App.ui.artifacts.render);
            
            // Context menu for categories (right-click)
            document.getElementById('categoriesTree').addEventListener('contextmenu', EventHandlers.handleCategoryContextMenu);
            
            // Close context menu when clicking elsewhere
            document.addEventListener('click', () => {
                const contextMenu = document.querySelector('.context-menu');
                if (contextMenu) {
                    contextMenu.remove();
                }
            });
        },
        
        handleArtifactFormSubmit: async (e) => {
            e.preventDefault();
            
            const artifactId = document.getElementById('artifactId').value;
            const artifactData = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                url: document.getElementById('url').value,
                documentationType: document.getElementById('docType').value,
                author: document.getElementById('author').value,
                currentVersion: document.getElementById('version').value,
                programmingLanguage: document.getElementById('language').value,
                framework: document.getElementById('framework').value,
                licenseType: document.getElementById('license').value,
                categoryId: document.getElementById('categorySelect').value
            };

            try {
                if (artifactId) {
                    // Update existing artifact
                    await App.updateArtifact(artifactId, artifactData);
                } else {
                    // Create new artifact
                    await App.createArtifact(artifactData);
                }
                
                App.ui.modals.hide(document.getElementById('artifactModal'));
            } catch (error) {
                console.error('Error saving artifact:', error);
                alert('Failed to save artifact: ' + (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : error.message));
            }
        },
        
        handleCategoryFormSubmit: async (e) => {
            e.preventDefault();
            
            const categoryId = document.getElementById('categoryId').value;
            const categoryData = {
                name: document.getElementById('categoryName').value,
                parentCategoryId: document.getElementById('parentCategorySelect').value || null,
                position: 0 // Default position
            };
            
            try {
                if (categoryId) {
                    // Update existing category
                    await App.updateCategory(categoryId, categoryData);
                } else {
                    // Create new category
                    await App.createCategory(categoryData);
                }
                
                App.ui.modals.hide(document.getElementById('categoryModal'));
            } catch (error) {
                console.error('Error saving category:', error);
                App.utils.showError('Failed to save category.');
            }
        },
        
        handleVersionFormSubmit: async (e) => {
            e.preventDefault();
            
            const artifactId = document.getElementById('versionArtifactId').value;
            const versionData = {
                versionNumber: document.getElementById('versionNumber').value,
                notes: document.getElementById('versionNotes').value,
                downloadUrl: document.getElementById('downloadUrl').value
            };
            
            try {
                await App.addArtifactVersion(artifactId, versionData);
                App.ui.modals.hide(document.getElementById('versionModal'));
                
                // Refresh artifact details
                App.showArtifactDetails(artifactId);
            } catch (error) {
                console.error('Error adding version:', error);
                App.utils.showError('Failed to add version.');
            }
        },
        
        handleCategoryContextMenu: (e) => {
            // Find the category item that was right-clicked
            let target = e.target;
            while (target && !target.classList.contains('category-item')) {
                target = target.parentElement;
            }
            
            if (!target) return;
            
            e.preventDefault();
            
            const categoryId = target.dataset.id;
            if (!categoryId) return;

            console.log("INFO: Category id = ",  categoryId);

            App.ui.categories.showContextMenu(e, categoryId);
        }
    };
})();

export default EventHandlers;
