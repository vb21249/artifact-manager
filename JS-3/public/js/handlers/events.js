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
            
            // Show All Artifacts button
            const showAllBtn = document.getElementById('showAllBtn');
            if (showAllBtn) {
                showAllBtn.addEventListener('click', () => {
                    console.log('Show All button clicked');
                    // Clear category selection
                    App.models.category.setSelected(null);
                    // Clear any selected category UI
                    document.querySelectorAll('.category-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    // Render all artifacts
                    App.ui.artifacts.render();
                });
            }
            
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
                notes: document.getElementById('versionChanges').value, // This will be mapped to 'changes' in the API
                downloadUrl: document.getElementById('downloadUrl').value
            };

            try {
                // Validate inputs
                if (!versionData.versionNumber) {
                    throw new Error('Version number is required');
                }

                console.log('Submitting version data:', versionData);
                
                // Add the version
                const result = await window.App.api.artifacts.addVersion(artifactId, versionData);

                // If we reach here, the version was added successfully
                console.log('Version added successfully:', result);
                
                // Close the version modal
                window.App.ui.modals.hide(document.getElementById('versionModal'));
                
                // Show success message
                alert('Version added successfully!');
                
                // Clear the form
                document.getElementById('versionNumber').value = '';
                document.getElementById('versionChanges').value = '';
                document.getElementById('downloadUrl').value = '';
                
                // Refresh artifact details without a full page reload
                window.App.showArtifactDetails(artifactId);
            } catch (error) {
                console.error('Error adding version:', error);
                alert('Failed to add version: ' + error.message);
            }
        },
        
        handleCategoryContextMenu: (e) => {
            try {
                // Find the category item that was right-clicked
                let target = e.target;
                while (target && !target.classList.contains('category-item')) {
                    target = target.parentElement;
                }
                
                if (!target) return;
                
                e.preventDefault();
                
                const categoryId = target.dataset.id;
                if (!categoryId) return;

                console.log("INFO: Category context menu for id:", categoryId);

                // Create context menu directly here
                // Remove any existing context menus
                const existingMenu = document.querySelector('.context-menu');
                if (existingMenu) {
                    existingMenu.remove();
                }
                
                // Create context menu
                const contextMenu = document.createElement('div');
                contextMenu.className = 'context-menu';
                contextMenu.style.position = 'absolute';
                contextMenu.style.left = `${e.pageX}px`;
                contextMenu.style.top = `${e.pageY}px`;
                contextMenu.style.background = 'white';
                contextMenu.style.border = '1px solid #ccc';
                contextMenu.style.borderRadius = '3px';
                contextMenu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                contextMenu.style.padding = '5px 0';
                contextMenu.style.zIndex = '1000';
                
                // Add Edit menu item
                const editItem = document.createElement('div');
                editItem.textContent = 'Edit';
                editItem.style.padding = '5px 15px';
                editItem.style.cursor = 'pointer';
                editItem.addEventListener('mouseover', () => {
                    editItem.style.backgroundColor = '#f0f0f0';
                });
                editItem.addEventListener('mouseout', () => {
                    editItem.style.backgroundColor = 'transparent';
                });
                editItem.addEventListener('click', () => {
                    try {
                        console.log('Edit category clicked for ID:', categoryId);
                        
                        // Get the category from the model
                        const category = window.App.models.category.getById(categoryId);
                        console.log('Category found:', category);
                        
                        if (!category) {
                            console.error(`Category ${categoryId} not found in model`);
                            return;
                        }
                        
                        // Populate form
                        document.getElementById('categoryId').value = category.id;
                        document.getElementById('categoryName').value = category.name || '';
                        
                        // Populate parent category select
                        window.App.ui.forms.populateCategorySelects();
                        document.getElementById('parentCategorySelect').value = category.parentCategoryId || '';
                        
                        // Update modal title
                        document.getElementById('categoryModalTitle').textContent = 'Edit Category';
                        
                        // Show modal directly
                        const categoryModal = document.getElementById('categoryModal');
                        console.log('Category modal element:', categoryModal);
                        
                        if (categoryModal) {
                            categoryModal.style.display = 'block';
                            console.log('Modal display style set to block');
                        } else {
                            console.error('Category modal element not found');
                        }
                    } catch (err) {
                        console.error('Error in edit category click handler:', err);
                    }
                    
                    contextMenu.remove();
                });
                contextMenu.appendChild(editItem);
                
                // Add Delete menu item
                const deleteItem = document.createElement('div');
                deleteItem.textContent = 'Delete';
                deleteItem.style.padding = '5px 15px';
                deleteItem.style.cursor = 'pointer';
                deleteItem.addEventListener('mouseover', () => {
                    deleteItem.style.backgroundColor = '#f0f0f0';
                });
                deleteItem.addEventListener('mouseout', () => {
                    deleteItem.style.backgroundColor = 'transparent';
                });
                deleteItem.addEventListener('click', () => {
                    if (confirm(`Are you sure you want to delete this category?`)) {
                        window.App.deleteCategory(categoryId);
                    }
                    contextMenu.remove();
                });
                contextMenu.appendChild(deleteItem);
                
                // Add to document
                document.body.appendChild(contextMenu);
                
                // Close context menu when clicking elsewhere
                document.addEventListener('click', () => {
                    contextMenu.remove();
                }, { once: true });
            } catch (error) {
                console.error('Error in handleCategoryContextMenu:', error);
            }
        },
    };
})();

export default EventHandlers;
