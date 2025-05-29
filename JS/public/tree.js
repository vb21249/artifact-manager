class CategoryTree {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.draggedItem = null;
        this.apiBaseUrl = 'http://localhost:8082/api';
        this.expandedNodes = new Set(); // Track expanded categories
        this.expandedArtifacts = new Set(); // Track expanded artifacts
        this.searchInput = document.getElementById('search-input');
        this.searchCriteria = document.getElementById('search-criteria');
        this.applyFilterBtn = document.getElementById('apply-filter');
        this.showAllBtn = document.getElementById('show-all');
        this.init();
    }

    async init() {
        try {
            await this.loadCategories();
            this.setupEventListeners();
            this.setupFilterButton();
            this.setupShowAllButton();
        } catch (error) {
            this.handleError(error);
        }
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/Categories`);
            if (!response.ok) throw new Error('Failed to load categories');
            this.data = await response.json();
            this.render();
        } catch (error) {
            this.handleError(error);
        }
    }

    setupShowAllButton() {
        this.showAllBtn.addEventListener('click', () => {
            // Clear search input
            this.searchInput.value = '';
            // Reset search criteria to default
            this.searchCriteria.selectedIndex = 0;
            // Load all categories without any filters
            this.loadCategories();
        });
    }

    setupFilterButton() {
        this.applyFilterBtn.addEventListener('click', () => {
            const query = this.searchInput.value.trim();
            if (!query) {
                this.loadCategories(); // Reset to original tree view
                return;
            }
            
            const criteria = this.searchCriteria.value;
            switch (criteria) {
                case 'language':
                    this.filterByLanguage(query);
                    break;
                case 'framework':
                    this.filterByFramework(query);
                    break;
                case 'license':
                    this.filterByLicense(query);
                    break;
            }
        });

        // Also handle Enter key
        this.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.applyFilterBtn.click();
            }
        });
    }

    async filterByLanguage(language) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/Artifacts/filter/language?language=${encodeURIComponent(language)}`);
            if (!response.ok) throw new Error('Filter failed');
            const results = await response.json();
            await this.loadCategoryTreeWithArtifacts(results);
        } catch (error) {
            this.handleError(error);
        }
    }

    async filterByFramework(framework) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/Artifacts/filter/framework?framework=${encodeURIComponent(framework)}`);
            if (!response.ok) throw new Error('Filter failed');
            const results = await response.json();
            await this.loadCategoryTreeWithArtifacts(results);
        } catch (error) {
            this.handleError(error);
        }
    }

    async filterByLicense(license) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/Artifacts/filter/license?licenseType=${encodeURIComponent(license)}`);
            if (!response.ok) throw new Error('Filter failed');
            const results = await response.json();
            await this.loadCategoryTreeWithArtifacts(results);
        } catch (error) {
            this.handleError(error);
        }
    }

    render() {
        this.container.innerHTML = '';
        if (!this.data || this.data.length === 0) {
            this.container.innerHTML = `
                <div class="no-results">No categories found</div>
                <button class="add-root-category">Add Root Category</button>
            `;
            this.setupAddRootCategoryButton();
            return;
        }

        const categoriesList = document.createElement('div');
        categoriesList.className = 'categories-list';

        // Add root category button at the top
        const addRootButton = document.createElement('button');
        addRootButton.className = 'add-root-category';
        addRootButton.textContent = 'Add Root Category';
        categoriesList.appendChild(addRootButton);
        
        this.data.forEach(category => {
            categoriesList.appendChild(this.renderCategory(category));
        });

        this.container.appendChild(categoriesList);
        this.setupAddRootCategoryButton();
    }

    renderCategory(category, level = 0) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-item';
        categoryDiv.draggable = true;
        categoryDiv.dataset.id = category.id;
        categoryDiv.style.marginLeft = level > 0 ? `${level * 20}px` : '0';
        
        categoryDiv.innerHTML = `
            <div class="category-header">
                <h3>${this.escapeHtml(category.name)}</h3>
                <div class="category-actions">
                    <button class="edit-category">Edit</button>
                    <button class="delete-category">Delete</button>
                    <button class="add-subcategory">Add Subcategory</button>
                    <button class="add-artifact">Add Artifact</button>
                </div>
            </div>
        `;

        // Setup category action buttons
        const actions = categoryDiv.querySelector('.category-actions');
        actions.querySelector('.edit-category').onclick = (e) => {
            e.stopPropagation();
            this.editCategory(category.id, category.name);
        };
        actions.querySelector('.delete-category').onclick = (e) => {
            e.stopPropagation();
            this.deleteCategory(category.id);
        };
        actions.querySelector('.add-subcategory').onclick = (e) => {
            e.stopPropagation();
            this.addSubcategory(category.id);
        };
        actions.querySelector('.add-artifact').onclick = (e) => {
            e.stopPropagation();
            this.addArtifact(category.id);
        };

        // Render artifacts if any
        if (category.artifacts && category.artifacts.length > 0) {
            const artifactsList = document.createElement('div');
            artifactsList.className = 'category-artifacts';
            
            category.artifacts.forEach(artifact => {
                artifactsList.appendChild(this.renderArtifact(artifact));
            });
            
            categoryDiv.appendChild(artifactsList);
        }

        // Render subcategories recursively
        if (category.subcategories && category.subcategories.length > 0) {
            const subcategoriesDiv = document.createElement('div');
            subcategoriesDiv.className = 'subcategories';
            
            category.subcategories.forEach(subcategory => {
                subcategoriesDiv.appendChild(this.renderCategory(subcategory, level + 1));
            });
            
            categoryDiv.appendChild(subcategoriesDiv);
        }

        return categoryDiv;
    }

    renderArtifact(artifact) {
        const artifactDiv = document.createElement('div');
        artifactDiv.className = 'artifact-item';
        artifactDiv.draggable = true;
        artifactDiv.dataset.id = artifact.id;
        artifactDiv.innerHTML = `
            <div class="artifact-header">
                <h4>${this.escapeHtml(artifact.title)}</h4>
                <div class="artifact-actions">
                    <button class="delete-artifact">Delete</button>
                </div>
            </div>
            <div class="artifact-details">
                <p>${this.escapeHtml(artifact.description)}</p>
                <div class="artifact-info">
                    <span>Author: ${this.escapeHtml(artifact.author)}</span>
                    <span>Version: ${this.escapeHtml(artifact.currentVersion)}</span>
                    <span>Type: ${this.escapeHtml(artifact.documentationType)}</span>
                    <a href="${artifact.url}" target="_blank">View Resource</a>
                </div>
                <div class="artifact-tech">
                    <span>Language: ${this.escapeHtml(artifact.programmingLanguage)}</span>
                    <span>Framework: ${this.escapeHtml(artifact.framework)}</span>
                    <span>License: ${this.escapeHtml(artifact.licenseType)}</span>
                </div>
            </div>
        `;

        // Setup delete artifact button
        const deleteBtn = artifactDiv.querySelector('.delete-artifact');
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteArtifact(artifact.id);
        };

        return artifactDiv;
    }

    async loadCategoryTreeWithArtifacts(filteredArtifacts) {
        try {
            // Get the full category tree
            const response = await fetch(`${this.apiBaseUrl}/Categories`);
            if (!response.ok) throw new Error('Failed to load categories');
            const categories = await response.json();

            // Create a set of artifact IDs for quick lookup
            const filteredArtifactIds = new Set(filteredArtifacts.map(a => a.id));

            // Filter the category tree to only include categories that contain filtered artifacts
            const filterCategory = (category) => {
                // Keep track of whether this category or its subcategories contain matching artifacts
                let hasMatchingArtifacts = false;

                // Filter artifacts in this category
                if (category.artifacts) {
                    category.artifacts = category.artifacts.filter(artifact => 
                        filteredArtifactIds.has(artifact.id)
                    );
                    hasMatchingArtifacts = category.artifacts.length > 0;
                }

                // Recursively filter subcategories
                if (category.subcategories) {
                    category.subcategories = category.subcategories
                        .map(filterCategory)
                        .filter(sub => sub !== null);
                    hasMatchingArtifacts = hasMatchingArtifacts || category.subcategories.length > 0;
                }

                // Return the category if it has matching artifacts, null otherwise
                return hasMatchingArtifacts ? category : null;
            };

            // Filter the entire tree
            this.data = categories
                .map(filterCategory)
                .filter(category => category !== null);

            this.render();
        } catch (error) {
            this.handleError(error);
        }
    }

    setupAddRootCategoryButton() {
        const addRootBtn = this.container.querySelector('.add-root-category');
        if (addRootBtn) {
            addRootBtn.onclick = () => this.addRootCategory();
        }
    }

    async addRootCategory() {
        const name = prompt('Enter category name:');
        if (!name) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/Categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    parentCategoryId: null,
                    position: this.data ? this.data.length : 0
                })
            });

            if (!response.ok) throw new Error('Failed to create category');
            await this.loadCategories();
        } catch (error) {
            this.handleError(error);
        }
    }

    async addSubcategory(parentId) {
        const name = prompt('Enter subcategory name:');
        if (!name) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/Categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    parentCategoryId: parentId,
                    position: 0
                })
            });

            if (!response.ok) throw new Error('Failed to create subcategory');
            await this.loadCategories();
        } catch (error) {
            this.handleError(error);
        }
    }

    async editCategory(categoryId, currentName) {
        const newName = prompt('Enter new category name:', currentName);
        if (!newName || newName === currentName) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/Categories/${categoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });

            if (!response.ok) throw new Error('Failed to update category');
            await this.loadCategories();
        } catch (error) {
            this.handleError(error);
        }
    }

    async deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category and all its contents?')) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/Categories/${categoryId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete category');
            await this.loadCategories();
        } catch (error) {
            this.handleError(error);
        }
    }

    async addArtifact(categoryId) {
        const artifact = await this.showArtifactDialog();
        if (!artifact) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/Artifacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...artifact,
                    categoryId
                })
            });

            if (!response.ok) throw new Error('Failed to create artifact');
            await this.loadCategories();
        } catch (error) {
            this.handleError(error);
        }
    }

    async deleteArtifact(artifactId) {
        if (!confirm('Are you sure you want to delete this artifact?')) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/Artifacts/${artifactId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete artifact');
            await this.loadCategories();
        } catch (error) {
            this.handleError(error);
        }
    }

    showArtifactDialog() {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'dialog-overlay';
            dialog.innerHTML = `
                <div class="dialog">
                    <h2>Add New Artifact</h2>
                    <form id="artifactForm">
                        <div class="form-group">
                            <label for="title">Title*:</label>
                            <input type="text" id="title" required>
                        </div>
                        <div class="form-group">
                            <label for="description">Description*:</label>
                            <textarea id="description" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="url">URL*:</label>
                            <input type="url" id="url" required>
                        </div>
                        <div class="form-group">
                            <label for="author">Author*:</label>
                            <input type="text" id="author" required>
                        </div>
                        <div class="form-group">
                            <label for="version">Version*:</label>
                            <input type="text" id="version" value="1.0" required>
                        </div>
                        <div class="form-group">
                            <label for="docType">Documentation Type*:</label>
                            <select id="docType" required>
                                <option value="Guide">Guide</option>
                                <option value="Tutorial">Tutorial</option>
                                <option value="API">API Documentation</option>
                                <option value="Reference">Reference</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="language">Programming Language:</label>
                            <input type="text" id="language" value="None">
                        </div>
                        <div class="form-group">
                            <label for="framework">Framework:</label>
                            <input type="text" id="framework" value="None">
                        </div>
                        <div class="form-group">
                            <label for="license">License Type:</label>
                            <input type="text" id="license" value="None">
                        </div>
                        <div class="dialog-buttons">
                            <button type="submit">Create</button>
                            <button type="button" class="cancel">Cancel</button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(dialog);

            const form = dialog.querySelector('form');
            const cancelBtn = dialog.querySelector('.cancel');

            form.onsubmit = (e) => {
                e.preventDefault();
                const formData = {
                    title: form.querySelector('#title').value.trim(),
                    description: form.querySelector('#description').value.trim(),
                    url: form.querySelector('#url').value.trim(),
                    author: form.querySelector('#author').value.trim(),
                    currentVersion: form.querySelector('#version').value.trim(),
                    documentationType: form.querySelector('#docType').value,
                    programmingLanguage: form.querySelector('#language').value.trim() || 'None',
                    framework: form.querySelector('#framework').value.trim() || 'None',
                    licenseType: form.querySelector('#license').value.trim() || 'None'
                };
                dialog.remove();
                resolve(formData);
            };

            cancelBtn.onclick = () => {
                dialog.remove();
                resolve(null);
            };
        });
    }

    setupEventListeners() {
        // Drag and drop functionality
        this.container.addEventListener('dragstart', (e) => {
            const artifactItem = e.target.closest('.artifact-item');
            const categoryItem = e.target.closest('.category-item');
            
            if (artifactItem) {
                this.draggedItem = artifactItem;
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    id: artifactItem.dataset.id,
                    type: 'artifact'
                }));
                artifactItem.classList.add('dragging');
            } else if (categoryItem) {
                this.draggedItem = categoryItem;
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    id: categoryItem.dataset.id,
                    type: 'category'
                }));
                categoryItem.classList.add('dragging');
            }
        });

        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dropTarget = e.target.closest('.category-item');
            if (dropTarget) {
                dropTarget.classList.add('drag-over');
                
                // Show position indicators
                this.showPositionIndicators(e, dropTarget);
            }
        });

        this.container.addEventListener('dragleave', (e) => {
            const dropTarget = e.target.closest('.category-item');
            if (dropTarget) {
                dropTarget.classList.remove('drag-over');
                this.hidePositionIndicators();
            }
        });

        this.container.addEventListener('drop', async (e) => {
            e.preventDefault();
            const dropTarget = e.target.closest('.category-item');
            if (!dropTarget) return;

            dropTarget.classList.remove('drag-over');
            this.hidePositionIndicators();
            
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            
            // Calculate drop position
            const position = this.calculateDropPosition(e, dropTarget);
            
            if (data.type === 'artifact') {
                if (dropTarget) {
                    await this.moveArtifact(data.id, dropTarget.dataset.id, position);
                }
            } else if (data.type === 'category') {
                if (dropTarget && this.draggedItem) {
                    const draggedId = parseInt(data.id);
                    const targetId = parseInt(dropTarget.dataset.id);

                    if (draggedId !== targetId) {
                        // Check if we're not trying to move a category into its own descendant
                        const draggedPath = this.findCategoryPath(draggedId);
                        const targetPath = this.findCategoryPath(targetId);
                        
                        if (!targetPath.startsWith(draggedPath)) {
                            await this.moveCategory(draggedId, targetId, position);
                        } else {
                            alert('Cannot move a category into its own descendant');
                        }
                    }
                }
            }

            if (this.draggedItem) {
                this.draggedItem.classList.remove('dragging');
                this.draggedItem = null;
            }
        });

        this.container.addEventListener('dragend', () => {
            if (this.draggedItem) {
                this.draggedItem.classList.remove('dragging');
                this.draggedItem = null;
            }
            const dragOverItems = this.container.querySelectorAll('.drag-over');
            dragOverItems.forEach(item => item.classList.remove('drag-over'));
            this.hidePositionIndicators();
        });
    }

    // Find the path of a category in the tree
    findCategoryPath(categoryId) {
        const findPath = (categories, id) => {
            for (const category of categories) {
                if (category.id === id) {
                    return category.path || '';
                }
                if (category.subcategories && category.subcategories.length > 0) {
                    const path = findPath(category.subcategories, id);
                    if (path) return path;
                }
            }
            return '';
        };
        
        return findPath(this.data, categoryId);
    }

    // Show position indicators when dragging over a category
    showPositionIndicators(event, targetElement) {
        this.hidePositionIndicators();
        
        // Create position indicator
        const indicator = document.createElement('div');
        indicator.className = 'position-indicator';
        
        // Calculate position based on mouse Y position relative to the target
        const rect = targetElement.getBoundingClientRect();
        const relativeY = event.clientY - rect.top;
        const position = Math.floor(relativeY / 20); // Approximate height of items
        
        // Position the indicator
        indicator.style.top = `${position * 20}px`;
        indicator.style.width = `${rect.width}px`;
        
        targetElement.appendChild(indicator);
        targetElement.dataset.dropPosition = position;
    }

    // Hide all position indicators
    hidePositionIndicators() {
        const indicators = document.querySelectorAll('.position-indicator');
        indicators.forEach(indicator => indicator.remove());
    }

    // Calculate the drop position based on mouse position
    calculateDropPosition(event, targetElement) {
        const position = parseInt(targetElement.dataset.dropPosition || '0');
        delete targetElement.dataset.dropPosition;
        return position;
    }

    async moveArtifact(artifactId, newCategoryId, position) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/Artifacts/${artifactId}/move`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    newCategoryId: parseInt(newCategoryId, 10),
                    position: position
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to move artifact');
            }

            const result = await response.json();
            this.data = result.categories;
            this.render();
        } catch (error) {
            console.error('Error moving artifact:', error);
            alert(error.message);
        }
    }

    async moveCategory(categoryId, newParentId, position) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/Categories/${categoryId}/move-to`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    newParentId: parseInt(newParentId, 10),
                    position: position
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to move category');
            }

            const result = await response.json();
            this.data = result.categories;
            this.render();
        } catch (error) {
            console.error('Error moving category:', error);
            alert(error.message);
        }
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    handleError(error) {
        console.error('Error:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = error.message || 'An error occurred';
        this.container.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CategoryTree('category-tree');
});
