class CategoryTree {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.draggedNode = null;
        this.apiBaseUrl = 'http://localhost:8080/api';
        this.expandedNodes = new Set(); // Track expanded categories
        this.expandedArtifacts = new Set(); // Track expanded artifacts
        this.init();
    }

    async init() {
        try {
            await this.loadCategories();
            this.setupEventListeners();
        } catch (error) {
            this.handleError(error);
        }
    }

    handleError(error) {
        console.error('API Error:', error);
        let errorMessage = 'An error occurred';
        
        if (error.response) {
            // Try to get detailed error message
            if (typeof error.response.json === 'function') {
                error.response.json().then(data => {
                    if (data.errors) {
                        errorMessage = Object.entries(data.errors)
                            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                            .join('\n');
                    } else if (data.detail) {
                        errorMessage = data.detail;
                    } else if (data.message) {
                        errorMessage = data.message;
                    }
                    this.showError(errorMessage);
                }).catch(() => {
                    this.showError(`Server error: ${error.response.status}`);
                });
                return;
            }
            errorMessage = `Server error: ${error.response.status}`;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        this.showError(errorMessage);
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/Categories`);
            if (!response.ok) throw { response };
            this.data = await response.json();
            this.render();
        } catch (error) {
            this.handleError(error);
        }
    }

    async createCategory(name, parentId = null, position = 0) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/Categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, parentCategoryId: parentId, position })
            });

            if (!response.ok) throw { response };
            this.loadCategories();
        } catch (error) {
            this.handleError(error);
        }
    }

    async createArtifact(categoryId) {
        try {
            const artifactData = await this.showArtifactDialog();
            if (!artifactData) return;

            const response = await fetch(`${this.apiBaseUrl}/Artifacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...artifactData,
                    categoryId: categoryId,
                    framework: artifactData.framework || "None",
                    licenseType: artifactData.licenseType || "None",
                    currentVersion: artifactData.currentVersion || "1.0",
                    documentationType: artifactData.documentationType || "Guide",
                    programmingLanguage: artifactData.programmingLanguage || "None"
                })
            });

            const data = await response.json();
            if (!response.ok) {
                if (data.errors) {
                    throw new Error(Object.entries(data.errors)
                        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                        .join('\n'));
                }
                throw new Error(data.message || 'Failed to create artifact');
            }
            
            await this.loadCategories();
        } catch (error) {
            this.handleError(error);
        }
    }

    async deleteArtifact(artifactId, event) {
        event.stopPropagation(); // Prevent triggering artifact expansion
        if (!confirm('Are you sure you want to delete this artifact?')) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/Artifacts/${artifactId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete artifact');
            }
            
            await this.loadCategories();
        } catch (error) {
            this.handleError(error);
        }
    }

    async deleteCategory(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/Categories/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw { response };
            await this.loadCategories();
        } catch (error) {
            this.handleError(error);
        }
    }

    async updateCategory(id, name, position) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/Categories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    position: position
                })
            });

            if (!response.ok) throw { response };
            await this.loadCategories();
        } catch (error) {
            this.handleError(error);
        }
    }

    async updateCategoryPosition(categoryId, newPosition) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/Categories/${categoryId}/position`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    position: newPosition
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to update category position');
            }
            await this.loadCategories();
        } catch (error) {
            this.handleError(error);
        }
    }

    createNodeElement(node, level = 0) {
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'tree-node';
        nodeDiv.dataset.id = node.id;
        nodeDiv.dataset.level = level;
        nodeDiv.draggable = true;

        const content = document.createElement('div');
        content.className = 'tree-content';

        const expandCollapse = document.createElement('span');
        expandCollapse.className = 'expand-collapse';
        expandCollapse.textContent = node.subcategories?.length > 0 ? '▶' : '•';

        const name = document.createElement('span');
        name.className = 'node-name';
        name.textContent = `${node.name} (${node.artifactsCount || 0})`;

        const actions = document.createElement('div');
        actions.className = 'node-actions';
        
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            const newName = prompt('Enter new name:', node.name);
            if (newName && newName !== node.name) {
                this.updateCategory(node.id, newName, node.position);
            }
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this category and all its artifacts?')) {
                this.deleteCategory(node.id);
            }
        };

        const addCategoryBtn = document.createElement('button');
        addCategoryBtn.textContent = 'Add Category';
        addCategoryBtn.onclick = (e) => {
            e.stopPropagation();
            const name = prompt('Enter new category name:');
            if (name) {
                const position = node.subcategories ? node.subcategories.length : 0;
                this.createCategory(name, node.id, position);
            }
        };

        const addArtifactBtn = document.createElement('button');
        addArtifactBtn.textContent = 'Add Artifact';
        addArtifactBtn.onclick = (e) => {
            e.stopPropagation();
            this.createArtifact(node.id);
        };

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        actions.appendChild(addCategoryBtn);
        actions.appendChild(addArtifactBtn);

        content.appendChild(expandCollapse);
        content.appendChild(name);
        content.appendChild(actions);
        nodeDiv.appendChild(content);

        // Add artifacts list
        if (node.artifacts && node.artifacts.length > 0) {
            const artifactsList = document.createElement('div');
            artifactsList.className = 'artifacts-list';
            
            node.artifacts.forEach(artifact => {
                const artifactDiv = document.createElement('div');
                artifactDiv.className = 'artifact-item';

                const artifactHeader = document.createElement('div');
                artifactHeader.className = 'artifact-header';

                const expandCollapseArtifact = document.createElement('span');
                expandCollapseArtifact.className = 'expand-collapse';
                expandCollapseArtifact.textContent = this.expandedArtifacts.has(artifact.id) ? '▼' : '▶';

                const titleDiv = document.createElement('div');
                titleDiv.className = 'artifact-title';
                titleDiv.textContent = artifact.title;

                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-artifact';
                deleteButton.textContent = '×';
                deleteButton.onclick = (e) => this.deleteArtifact(artifact.id, e);

                artifactHeader.appendChild(expandCollapseArtifact);
                artifactHeader.appendChild(titleDiv);
                artifactHeader.appendChild(deleteButton);

                const artifactDetails = document.createElement('div');
                artifactDetails.className = 'artifact-details' + 
                    (this.expandedArtifacts.has(artifact.id) ? '' : ' collapsed');
                artifactDetails.innerHTML = `
                    <p class="artifact-description">${artifact.description}</p>
                    <div class="artifact-info">
                        <span>Author: ${artifact.author}</span>
                        <span>Version: ${artifact.currentVersion}</span>
                        <span>Type: ${artifact.documentationType}</span>
                        <a href="${artifact.url}" target="_blank">View Resource</a>
                    </div>
                    <div class="artifact-tech">
                        <span>Language: ${artifact.programmingLanguage}</span>
                        <span>Framework: ${artifact.framework}</span>
                        <span>License: ${artifact.licenseType}</span>
                    </div>
                `;

                artifactDiv.appendChild(artifactHeader);
                artifactDiv.appendChild(artifactDetails);

                // Add click handler for expansion
                artifactHeader.onclick = (e) => {
                    if (e.target.classList.contains('delete-artifact')) return;
                    const isExpanded = !artifactDetails.classList.contains('collapsed');
                    if (isExpanded) {
                        this.expandedArtifacts.delete(artifact.id);
                    } else {
                        this.expandedArtifacts.add(artifact.id);
                    }
                    expandCollapseArtifact.textContent = isExpanded ? '▶' : '▼';
                    artifactDetails.classList.toggle('collapsed');
                };

                artifactsList.appendChild(artifactDiv);
            });
            nodeDiv.appendChild(artifactsList);
        }

        if (node.subcategories?.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'children' + 
                (this.expandedNodes.has(node.id) ? ' expanded' : '');
            node.subcategories.forEach(child => {
                childrenContainer.appendChild(this.createNodeElement(child, level + 1));
            });
            nodeDiv.appendChild(childrenContainer);

            // Update arrow based on expanded state
            expandCollapse.textContent = this.expandedNodes.has(node.id) ? '▼' : '▶';
        }

        return nodeDiv;
    }

    setupEventListeners() {
        this.container.addEventListener('click', (e) => {
            const expandCollapse = e.target.closest('.expand-collapse');
            if (expandCollapse) {
                const node = expandCollapse.closest('.tree-node');
                const children = node.querySelector('.children');
                if (children) {
                    const nodeId = parseInt(node.dataset.id);
                    const isExpanded = children.classList.contains('expanded');
                    if (isExpanded) {
                        this.expandedNodes.delete(nodeId);
                    } else {
                        this.expandedNodes.add(nodeId);
                    }
                    children.classList.toggle('expanded');
                    expandCollapse.textContent = children.classList.contains('expanded') ? '▼' : '▶';
                }
            }
        });

        this.container.addEventListener('dragstart', (e) => {
            const node = e.target.closest('.tree-node');
            if (node) {
                this.draggedNode = node;
                node.classList.add('dragging');
                e.dataTransfer.setData('text/plain', node.dataset.id);
            }
        });

        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const target = e.target.closest('.tree-node');
            if (target && target !== this.draggedNode) {
                target.classList.add('drag-over');
            }
        });

        this.container.addEventListener('dragleave', (e) => {
            const target = e.target.closest('.tree-node');
            if (target) {
                target.classList.remove('drag-over');
            }
        });

        this.container.addEventListener('drop', async (e) => {
            e.preventDefault();
            const target = e.target.closest('.tree-node');
            if (target && this.draggedNode) {
                const draggedId = parseInt(this.draggedNode.dataset.id);
                const targetId = parseInt(target.dataset.id);
                
                if (draggedId !== targetId) {
                    const targetChildren = target.parentNode.children;
                    const newPosition = Array.from(targetChildren).indexOf(target);
                    await this.updateCategoryPosition(draggedId, newPosition);
                }
                
                target.classList.remove('drag-over');
                this.draggedNode.classList.remove('dragging');
            }
            this.draggedNode = null;
        });
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
                            <label for="docType">Documentation Type*:</label>
                            <select id="docType" required>
                                <option value="Guide">Guide</option>
                                <option value="Tutorial">Tutorial</option>
                                <option value="API">API Documentation</option>
                                <option value="Reference">Reference</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="author">Author*:</label>
                            <input type="text" id="author" required>
                        </div>
                        <div class="form-group">
                            <label for="version">Current Version*:</label>
                            <input type="text" id="version" value="1.0" required>
                        </div>
                        <div class="form-group">
                            <label for="progLang">Programming Language*:</label>
                            <input type="text" id="progLang" value="None" required>
                        </div>
                        <div class="form-group">
                            <label for="framework">Framework*:</label>
                            <input type="text" id="framework" value="None" required>
                        </div>
                        <div class="form-group">
                            <label for="license">License Type*:</label>
                            <input type="text" id="license" value="None" required>
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
                    documentationType: form.querySelector('#docType').value,
                    author: form.querySelector('#author').value.trim(),
                    currentVersion: form.querySelector('#version').value.trim(),
                    programmingLanguage: form.querySelector('#progLang').value.trim(),
                    framework: form.querySelector('#framework').value.trim(),
                    licenseType: form.querySelector('#license').value.trim()
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

    render() {
        this.container.innerHTML = '';
        
        // Add "New Root Category" button at the top
        const newRootBtn = document.createElement('button');
        newRootBtn.className = 'new-root-btn';
        newRootBtn.textContent = 'New Root Category';
        newRootBtn.onclick = () => {
            const name = prompt('Enter new category name:');
            if (name) {
                const position = this.data ? this.data.length : 0;
                this.createCategory(name, null, position);
            }
        };
        this.container.appendChild(newRootBtn);

        this.data.forEach(node => {
            this.container.appendChild(this.createNodeElement(node));
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = message.replace(/\n/g, '<br>');
        this.container.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CategoryTree('category-tree');
});
