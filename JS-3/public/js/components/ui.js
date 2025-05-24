// UI components and rendering functions
const UI = (() => {
    // DOM Elements
    const categoriesTree = document.getElementById('categoriesTree');
    const artifactsList = document.getElementById('artifactsList');
    const searchInput = document.getElementById('searchInput');
    const languageFilter = document.getElementById('languageFilter');
    const frameworkFilter = document.getElementById('frameworkFilter');
    const licenseFilter = document.getElementById('licenseFilter');
    
    // Modal elements
    const artifactModal = document.getElementById('artifactModal');
    const categoryModal = document.getElementById('categoryModal');
    const artifactDetailsModal = document.getElementById('artifactDetailsModal');
    const versionModal = document.getElementById('versionModal');
    
    return {
        // Category UI functions
        categories: {
            render: () => {
                categoriesTree.innerHTML = '';
                
                // Build a hierarchical structure
                const rootCategories = App.models.category.getRootCategories();
                rootCategories.forEach(category => {
                    const categoryElement = UI.categories.createCategoryElement(category);
                    categoriesTree.appendChild(categoryElement);
                });
            },


            // TODO: has children gives always false
            createCategoryElement: (category) => {
                const categoryItem = document.createElement('div');
                categoryItem.className = 'category-item draggable';
                categoryItem.dataset.id = category.id;
                categoryItem.draggable = true;
                
                if (category.id === App.models.category.getSelected()) {
                    categoryItem.classList.add('selected');
                }
                
                // Check if this category has children
                const hasChildren = App.models.category.hasChildren(category.id);

                console.log(category.id + ' has ' + (hasChildren ? 'children' : 'no children'));
                
                const expander = document.createElement('span');
                expander.className = 'expander';
                expander.textContent = hasChildren ? '▶' : '  ';
                categoryItem.appendChild(expander);
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = category.name;
                categoryItem.appendChild(nameSpan);
                
                // Set up drag and drop
                categoryItem.addEventListener('dragstart', (e) => {
                    App.draggedItem = category;
                    App.draggedItemType = 'category';
                    categoryItem.classList.add('dragging');
                    e.dataTransfer.setData('text/plain', category.id);
                    e.dataTransfer.effectAllowed = 'move';
                });
                
                categoryItem.addEventListener('dragend', () => {
                    categoryItem.classList.remove('dragging');
                    App.utils.clearDropTargets();
                });
                
                categoryItem.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (App.draggedItemType === 'category' && App.draggedItem.id !== category.id) {
                        categoryItem.classList.add('drop-target');
                    }
                });
                
                categoryItem.addEventListener('dragleave', () => {
                    categoryItem.classList.remove('drop-target');
                });
                
                categoryItem.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    categoryItem.classList.remove('drop-target');
                    
                    if (App.draggedItemType === 'category' && App.draggedItem.id !== category.id) {
                        // Prevent moving a category into its own descendant
                        if (!App.models.category.isDescendant(category.id, App.draggedItem.id)) {
                            await App.moveCategory(App.draggedItem.id, category.id, 0);
                        }
                    } else if (App.draggedItemType === 'artifact') {
                        await App.moveArtifact(App.draggedItem.id, category.id, 0);
                    }
                });
                
                // Click to select
                categoryItem.addEventListener('click', (e) => {
                    if (e.target === expander) {
                        UI.categories.toggleExpansion(categoryItem);
                    } else {
                        App.selectCategory(category.id);
                    }
                });
                
                // If this category has children, create a container for them
                if (hasChildren) {
                    const childrenContainer = document.createElement('div');
                    childrenContainer.className = 'category-children';
                    childrenContainer.style.display = 'none'; // Initially collapsed
                    
                    const childCategories = App.models.category.getChildCategories(category.id);
                    childCategories.forEach(childCategory => {
                        const childElement = UI.categories.createCategoryElement(childCategory);
                        childrenContainer.appendChild(childElement);
                    });
                    
                    // Create a wrapper to hold both the category item and its children
                    const wrapper = document.createElement('div');
                    wrapper.className = 'category-wrapper';
                    wrapper.appendChild(categoryItem);
                    wrapper.appendChild(childrenContainer);
                    return wrapper;
                }
                
                return categoryItem;
            },
            
            toggleExpansion: (categoryItem) => {
                const expander = categoryItem.querySelector('.expander');
                const childrenContainer = categoryItem.parentElement.querySelector('.category-children');
                
                if (childrenContainer) {
                    if (childrenContainer.style.display === 'none') {
                        childrenContainer.style.display = 'block';
                        expander.textContent = '▼';
                    } else {
                        childrenContainer.style.display = 'none';
                        expander.textContent = '▶';
                    }
                }
            },
            
            showContextMenu: (e, categoryId) => {
                // Find the category item that was right-clicked
                let target = e.target;
                while (target && !target.classList.contains('category-item')) {
                    target = target.parentElement;
                }
                
                if (!target) return;
                
                e.preventDefault();
                
                if (!categoryId) return;
                
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
                
                // Add menu items
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
                    App.showEditCategoryForm(categoryId);
                    contextMenu.remove();
                });
                contextMenu.appendChild(editItem);
                
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
                        App.deleteCategory(categoryId);
                    }
                    contextMenu.remove();
                });
                contextMenu.appendChild(deleteItem);
                
                document.body.appendChild(contextMenu);
            }
        },
        
        // Artifact UI functions
        artifacts: {
            render: () => {
                artifactsList.innerHTML = '';
                
                // Get filtered artifacts
                const filters = {
                    categoryId: App.models.category.getSelected(),
                    searchTerm: searchInput.value,
                    language: languageFilter.value,
                    framework: frameworkFilter.value,
                    license: licenseFilter.value
                };
                
                const filteredArtifacts = App.models.artifact.filter(filters);
                
                // Render each artifact
                filteredArtifacts.forEach(artifact => {
                    const artifactElement = UI.artifacts.createArtifactElement(artifact);
                    artifactsList.appendChild(artifactElement);
                });
                
                // Show empty state if no artifacts
                if (filteredArtifacts.length === 0) {
                    const emptyState = document.createElement('div');
                    emptyState.className = 'empty-state';
                    emptyState.textContent = 'No artifacts found.';
                    artifactsList.appendChild(emptyState);
                }
            },
            
            createArtifactElement: (artifact) => {
                const artifactItem = document.createElement('div');
                artifactItem.className = 'artifact-item draggable';
                artifactItem.dataset.id = artifact.id;
                artifactItem.draggable = true;
                
                if (artifact.id === App.models.artifact.getSelected()) {
                    artifactItem.classList.add('selected');
                }
                
                const iconSpan = document.createElement('span');
                iconSpan.className = 'artifact-icon';
                iconSpan.textContent = '📄';
                artifactItem.appendChild(iconSpan);
                
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'artifact-details';
                
                const titleDiv = document.createElement('div');
                titleDiv.className = 'artifact-title';
                titleDiv.textContent = artifact.title;
                detailsDiv.appendChild(titleDiv);
                
                const metaDiv = document.createElement('div');
                metaDiv.className = 'artifact-meta';
                metaDiv.textContent = `Version ${artifact.currentVersion} • ${App.utils.formatDate(artifact.created)}`;
                detailsDiv.appendChild(metaDiv);
                
                const tagsDiv = document.createElement('div');
                tagsDiv.className = 'artifact-tags';
                
                if (artifact.programmingLanguage) {
                    const langTag = document.createElement('span');
                    langTag.className = 'artifact-tag';
                    langTag.textContent = artifact.programmingLanguage;
                    tagsDiv.appendChild(langTag);
                }
                
                if (artifact.framework) {
                    const frameworkTag = document.createElement('span');
                    frameworkTag.className = 'artifact-tag';
                    frameworkTag.textContent = artifact.framework;
                    tagsDiv.appendChild(frameworkTag);
                }
                
                if (artifact.licenseType) {
                    const licenseTag = document.createElement('span');
                    licenseTag.className = 'artifact-tag';
                    licenseTag.textContent = artifact.licenseType;
                    tagsDiv.appendChild(licenseTag);
                }
                
                detailsDiv.appendChild(tagsDiv);
                artifactItem.appendChild(detailsDiv);
                
                // Set up drag and drop
                artifactItem.addEventListener('dragstart', (e) => {
                    App.draggedItem = artifact;
                    App.draggedItemType = 'artifact';
                    artifactItem.classList.add('dragging');
                    e.dataTransfer.setData('text/plain', artifact.id);
                    e.dataTransfer.effectAllowed = 'move';
                });
                
                artifactItem.addEventListener('dragend', () => {
                    artifactItem.classList.remove('dragging');
                    App.utils.clearDropTargets();
                });
                
                // Click to view details
                artifactItem.addEventListener('click', () => {
                    App.selectArtifact(artifact.id);
                    App.showArtifactDetails(artifact.id);
                });
                
                return artifactItem;
            },
            
            showDetails: async (artifactId) => {
                try {
                    const artifact = await App.api.artifacts.getById(artifactId);
                    if (!artifact) throw new Error('Artifact not found');
                    
                    const versions = await App.api.artifacts.getVersions(artifactId);
                    
                    // Populate details
                    const detailsContainer = document.getElementById('artifactDetails');
                    detailsContainer.innerHTML = `
                        <h2>${artifact.title}</h2>
                        <div class="artifact-detail-description">${artifact.description || 'No description provided.'}</div>
                        <div class="artifact-detail-meta">
                            <div><strong>Version:</strong> ${artifact.currentVersion}</div>
                            <div><strong>Language:</strong> ${artifact.programmingLanguage || 'Not specified'}</div>
                            <div><strong>Framework:</strong> ${artifact.framework || 'Not specified'}</div>
                            <div><strong>License:</strong> ${artifact.licenseType || 'Not specified'}</div>
                            <div><strong>Created:</strong> ${App.utils.formatDate(artifact.created)}</div>
                        </div>
                    `;
                    
                    // Populate versions
                    const versionsContainer = document.getElementById('versionsList');
                    versionsContainer.innerHTML = '';
                    
                    if (versions && versions.length > 0) {
                        versions.forEach(version => {
                            const versionItem = document.createElement('div');
                            versionItem.className = 'version-item';
                            versionItem.innerHTML = `
                                <div class="version-number">v${version.versionNumber}</div>
                                <div class="version-notes">${version.notes || 'No release notes'}</div>
                                <div class="version-date">${App.utils.formatDate(version.created)}</div>
                                ${version.downloadUrl ? `<a href="${version.downloadUrl}" class="download-link" target="_blank">Download</a>` : ''}
                            `;
                            versionsContainer.appendChild(versionItem);
                        });
                    } else {
                        versionsContainer.innerHTML = '<div class="empty-state">No version history available.</div>';
                    }
                    
                    // Set up action buttons
                    document.getElementById('editArtifactBtn').onclick = () => {
                        App.showEditArtifactForm(artifact);
                    };
                    
                    document.getElementById('deleteArtifactBtn').onclick = () => {
                        if (confirm(`Are you sure you want to delete "${artifact.title}"?`)) {
                            App.deleteArtifact(artifact.id).then(() => {
                                UI.modals.hide(artifactDetailsModal);
                            });
                        }
                    };
                    
                    document.getElementById('addVersionBtn').onclick = () => {
                        App.showAddVersionForm(artifact.id);
                    };
                    
                    // Show the modal
                    UI.modals.show(artifactDetailsModal);
                } catch (error) {
                    console.error('Error showing artifact details:', error);
                    App.utils.showError('Failed to load artifact details.');
                }
            }
        },
        
        // Form handling
        forms: {
            populateFilters: () => {
                // Get unique values for filters
                const languages = App.models.artifact.getUniqueLanguages();
                const frameworks = App.models.artifact.getUniqueFrameworks();
                const licenses = App.models.artifact.getUniqueLicenses();
                
                // Populate language filter
                languageFilter.innerHTML = '<option value="">All Languages</option>';
                languages.forEach(lang => {
                    const option = document.createElement('option');
                    option.value = lang;
                    option.textContent = lang;
                    languageFilter.appendChild(option);
                });
                
                // Populate framework filter
                frameworkFilter.innerHTML = '<option value="">All Frameworks</option>';
                frameworks.forEach(framework => {
                    const option = document.createElement('option');
                    option.value = framework;
                    option.textContent = framework;
                    frameworkFilter.appendChild(option);
                });
                
                // Populate license filter
                licenseFilter.innerHTML = '<option value="">All Licenses</option>';
                licenses.forEach(license => {
                    const option = document.createElement('option');
                    option.value = license;
                    option.textContent = license;
                    licenseFilter.appendChild(option);
                });
            },
            
            populateCategorySelects: () => {
                const categorySelect = document.getElementById('categorySelect');
                const parentCategorySelect = document.getElementById('parentCategorySelect');
                
                // Clear existing options
                categorySelect.innerHTML = '';
                parentCategorySelect.innerHTML = '<option value="">None (Root Category)</option>';
                
                // Add options for each category
                App.models.category.getAll().forEach(category => {
                    const option1 = document.createElement('option');
                    option1.value = category.id;
                    option1.textContent = category.name;
                    categorySelect.appendChild(option1.cloneNode(true));
                    
                    const option2 = document.createElement('option');
                    option2.value = category.id;
                    option2.textContent = category.name;
                    parentCategorySelect.appendChild(option2);
                });
            }
        },
        
        // Modal handling
        modals: {
            show: (modal) => {
                modal.style.display = 'block';
            },
            
            hide: (modal) => {
                modal.style.display = 'none';
            },
            
            hideAll: () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            }
        }
    };
})();

export default UI;
