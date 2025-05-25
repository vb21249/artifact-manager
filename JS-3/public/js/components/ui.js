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
                console.log('Root categories:', rootCategories);
                rootCategories.forEach(category => {
                    const categoryElement = UI.categories.createCategoryElement(category);
                    categoriesTree.appendChild(categoryElement);
                });
            },


            // TODO: has children gives always false
            createCategoryElement: (category) => {
                // Create a wrapper div that will contain both the category item and its children
                const categoryWrapper = document.createElement('div');
                categoryWrapper.className = 'category-wrapper';
                
                // Create the actual category item for the current category
                const categoryItem = document.createElement('div');
                categoryItem.className = 'category-item draggable';
                categoryItem.dataset.id = category.id;
                categoryItem.draggable = true;
                
                if (category.id === App.models.category.getSelected()) {
                    categoryItem.classList.add('selected');
                }
                
                // Check if this category has children (either via subcategories array or parent-child relationship)
                const hasChildren = (category.subcategories && category.subcategories.length > 0) || 
                                   App.models.category.hasChildren(category.id);
                
                console.log(`Category ${category.name} (${category.id}) has children: ${hasChildren}`);
                
                const expander = document.createElement('span');
                expander.className = 'expander';
                expander.textContent = hasChildren ? '▶' : '  ';
                categoryItem.appendChild(expander);
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'category-name';
                nameSpan.textContent = category.name;
                categoryItem.appendChild(nameSpan);
                
                // Add event listeners
                categoryItem.addEventListener('click', (e) => {
                    if (e.target === expander && hasChildren) {
                        UI.categories.toggleExpansion(categoryWrapper);
                    } else if (e.target !== expander) {
                        App.selectCategory(category.id);
                    }
                    e.stopPropagation();
                });
                
                categoryItem.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    UI.categories.showContextMenu(e, category.id);
                });
                
                // Drag and drop event listeners
                categoryItem.addEventListener('dragstart', (e) => {
                    App.draggedItem = category.id;
                    App.draggedItemType = 'category';
                    e.dataTransfer.setData('text/plain', category.id);
                    setTimeout(() => categoryItem.classList.add('dragging'), 0);
                });
                
                categoryItem.addEventListener('dragend', () => {
                    categoryItem.classList.remove('dragging');
                });
                
                categoryItem.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (App.draggedItemType === 'category' && App.draggedItem !== category.id) {
                        // Don't allow dropping a category into its own descendant
                        if (!App.models.category.isDescendant(category.id, App.draggedItem)) {
                            categoryItem.classList.add('drag-over');
                        }
                    } else if (App.draggedItemType === 'artifact') {
                        categoryItem.classList.add('drag-over');
                    }
                });
                
                categoryItem.addEventListener('dragleave', () => {
                    categoryItem.classList.remove('drag-over');
                });
                
                categoryItem.addEventListener('drop', (e) => {
                    e.preventDefault();
                    categoryItem.classList.remove('drag-over');
                    
                    if (App.draggedItemType === 'category' && App.draggedItem !== category.id) {
                        // Don't allow dropping a category into its own descendant
                        if (!App.models.category.isDescendant(category.id, App.draggedItem)) {
                            App.moveCategory(App.draggedItem, category.id, 0);
                        }
                    } else if (App.draggedItemType === 'artifact') {
                        App.moveArtifact(App.draggedItem, category.id, 0);
                    }
                });
                
                // Create container for child categories
                if (hasChildren) {
                    const childrenContainer = document.createElement('div');
                    childrenContainer.className = 'category-children';
                    childrenContainer.style.display = 'none'; // Initially collapsed
                    
                    // Get child categories - first check subcategories array, then fall back to parent-child relationship
                    const childCategories = category.subcategories || App.models.category.getChildCategories(category.id);
                    
                    if (childCategories && childCategories.length > 0) {
                        childCategories.forEach(childCategory => {
                            const childElement = UI.categories.createCategoryElement(childCategory);
                            childrenContainer.appendChild(childElement);
                        });
                        
                        categoryWrapper.appendChild(categoryItem);
                        categoryWrapper.appendChild(childrenContainer);
                    } else {
                        categoryWrapper.appendChild(categoryItem);
                    }
                } else {
                    categoryWrapper.appendChild(categoryItem);
                }
                
                return categoryWrapper;
            },
            
            toggleExpansion: (categoryWrapper) => {
                const categoryItem = categoryWrapper.querySelector('.category-item');
                const expander = categoryItem.querySelector('.expander');
                const childrenContainer = categoryWrapper.querySelector('.category-children');
                
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
                            <div><strong>Version:</strong> ${artifact.currentVersion || 'Not specified'}</div>
                            <div><strong>Language:</strong> ${artifact.programmingLanguage || 'Not specified'}</div>
                            <div><strong>Framework:</strong> ${artifact.framework || 'Not specified'}</div>
                            <div><strong>License:</strong> ${artifact.licenseType || 'Not specified'}</div>
                            <div><strong>Documentation Type:</strong> ${artifact.documentationType || 'Not specified'}</div>
                            <div><strong>Author:</strong> ${artifact.author || 'Not specified'}</div>
                            <div><strong>URL:</strong> ${artifact.url ? `<a href="${artifact.url}" target="_blank">${artifact.url}</a>` : 'Not specified'}</div>
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
                                <div class="version-date">${version.created ? App.utils.formatDate(version.created) : 'Unknown date'}</div>
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
                                UI.modals.hide(document.getElementById('artifactDetailsModal'));
                            });
                        }
                    };
                    
                    document.getElementById('addVersionBtn').onclick = () => {
                        App.showAddVersionForm(artifact.id);
                    };
                    
                    // Show the modal
                    UI.modals.show(document.getElementById('artifactDetailsModal'));
                } catch (error) {
                    console.error('Error showing artifact details:', error);
                    alert('Failed to load artifact details: ' + error.message);
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
