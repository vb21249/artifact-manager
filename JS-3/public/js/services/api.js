// API service for handling all server communication
const ApiService = (() => {
    // Update the API base URL to match the backend server
    const API_BASE = '/api';
    
    // Error handler helper
    const handleError = (error, message) => {
        console.error(message, error);
        throw new Error(message);
    };
    
    return {
        // Category API methods
        categories: {
            getAll: async () => {
                try {
                    const response = await fetch(`${API_BASE}/categories`);
                    if (!response.ok) throw new Error('Failed to fetch categories');
                    return await response.json();
                } catch (error) {
                    handleError(error, 'Error fetching categories');
                    return [];
                }
            },
            
            create: async (categoryData) => {
                try {
                    const response = await fetch(`${API_BASE}/categories`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(categoryData)
                    });
                    
                    if (!response.ok) throw new Error('Failed to create category');
                    return await response.json();
                } catch (error) {
                    handleError(error, 'Error creating category');
                    return null;
                }
            },
            
            update: async (id, categoryData) => {
                try {
                    const response = await fetch(`${API_BASE}/categories/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(categoryData)
                    });
                    
                    if (!response.ok) throw new Error('Failed to update category');
                    return await response.json();
                } catch (error) {
                    handleError(error, 'Error updating category');
                    return null;
                }
            },
            
            delete: async (id) => {
                try {
                    const response = await fetch(`${API_BASE}/categories/${id}`, {
                        method: 'DELETE'
                    });
                    
                    if (!response.ok) throw new Error('Failed to delete category');
                    return true;
                } catch (error) {
                    handleError(error, `Error deleting category ${id}`);
                    return false;
                }
            },
            
            move: async (id, newParentId, position) => {
                try {
                    const response = await fetch(`${API_BASE}/categories/${id}/move-to`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ newParentId, position })
                    });
                    
                    if (!response.ok) throw new Error('Failed to move category');
                    return true;
                } catch (error) {
                    handleError(error, `Error moving category ${id}`);
                    return false;
                }
            }
        },
        
        // Artifact API methods
        artifacts: {
            getAll: async () => {
                try {
                    const response = await fetch(`${API_BASE}/artifacts`);
                    if (!response.ok) throw new Error('Failed to fetch artifacts');
                    return await response.json();
                } catch (error) {
                    handleError(error, 'Error fetching artifacts');
                    return [];
                }
            },
            
            getById: async (id) => {
                try {
                    const response = await fetch(`${API_BASE}/artifacts/${id}`);
                    if (!response.ok) throw new Error('Failed to fetch artifact details');
                    return await response.json();
                } catch (error) {
                    handleError(error, `Error fetching artifact ${id}`);
                    return null;
                }
            },
            
            getVersions: async (id) => {
                try {
                    // Since we're now storing versions in the artifact model directly,
                    // we need to access it through the global window object
                    if (window.App && window.App.models && window.App.models.artifact) {
                        // First check if the artifact exists in the client-side model
                        let artifact = window.App.models.artifact.getById(id);
                        
                        // If not found in the client-side model, try to fetch it from the API
                        if (!artifact) {
                            console.log(`Artifact ${id} not found in client model when getting versions, fetching from API...`);
                            try {
                                // Fetch the artifact from the API
                                const response = await fetch(`${API_BASE}/artifacts/${id}`);
                                if (response.ok) {
                                    artifact = await response.json();
                                    // Add it to the client-side model
                                    window.App.models.artifact.add(artifact);
                                    console.log(`Added artifact ${id} to client model when getting versions`);
                                }
                            } catch (fetchError) {
                                console.error('Error fetching artifact for versions:', fetchError);
                            }
                        }
                        
                        // Now try to get the versions
                        return window.App.models.artifact.getVersions(id) || [];
                    }
                    return [];
                } catch (error) {
                    handleError(error, `Error fetching versions for artifact ${id}`);
                    return [];
                }
            },
            
            create: async (artifactData) => {
                try {
                    const response = await fetch(`${API_BASE}/artifacts`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(artifactData)
                    });
                    
                    if (!response.ok) throw new Error('Failed to create artifact');
                    return await response.json();
                } catch (error) {
                    handleError(error, 'Error creating artifact');
                    return null;
                }
            },
            
            update: async (id, artifactData) => {
                try {
                    const response = await fetch(`${API_BASE}/artifacts/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(artifactData)
                    });
                    
                    if (!response.ok) throw new Error('Failed to update artifact');
                    return await response.json();
                } catch (error) {
                    handleError(error, `Error updating artifact ${id}`);
                    return null;
                }
            },
            
            delete: async (id) => {
                try {
                    const response = await fetch(`${API_BASE}/artifacts/${id}`, {
                        method: 'DELETE'
                    });
                    
                    if (!response.ok) throw new Error('Failed to delete artifact');
                    return true;
                } catch (error) {
                    handleError(error, `Error deleting artifact ${id}`);
                    return false;
                }
            },
            
            move: async (id, newCategoryId, position) => {
                try {
                    const response = await fetch(`${API_BASE}/artifacts/${id}/move`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ newCategoryId, position })
                    });
                    
                    if (!response.ok) throw new Error('Failed to move artifact');
                    return true;
                } catch (error) {
                    handleError(error, `Error moving artifact ${id}`);
                    return false;
                }
            },
            
            addVersion: async (artifactId, versionData) => {
                try {
                    console.log(`Adding version to artifact ${artifactId}:`, versionData);
                    
                    // Format the data according to the API requirements
                    const apiVersionData = {
                        versionNumber: versionData.versionNumber,
                        changes: versionData.notes, // Map notes to changes as per API
                        downloadUrl: versionData.downloadUrl
                    };
                    
                    // Use the correct case for the API endpoint (artifacts with lowercase a)
                    const versionEndpoint = `${API_BASE}/artifacts/${artifactId}/versions`;
                    console.log('API endpoint:', versionEndpoint);
                    console.log('API data being sent:', JSON.stringify(apiVersionData));
                    
                    // Make the API call to add the version
                    const response = await fetch(versionEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(apiVersionData)
                    });
                    
                    console.log('API response status:', response.status, response.statusText);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`API error (${response.status}):`, errorText);
                        throw new Error(`Failed to add version: ${response.statusText} (${response.status})`);
                    }
                    
                    // Get the response data
                    const newVersionData = await response.json();
                    console.log('Version added successfully via API:', newVersionData);
                    
                    // Update the client-side model
                    if (window.App && window.App.models && window.App.models.artifact) {
                        // First try to get the artifact from the model
                        let artifact = window.App.models.artifact.getById(artifactId);
                        
                        // If not found in the client-side model, try to fetch it from the API
                        if (!artifact) {
                            console.log(`Artifact ${artifactId} not found in client model, fetching from API...`);
                            try {
                                // Fetch the artifact from the API
                                const artifactResponse = await fetch(`${API_BASE}/artifacts/${artifactId}`);
                                if (artifactResponse.ok) {
                                    artifact = await artifactResponse.json();
                                    // Add it to the client-side model
                                    window.App.models.artifact.add(artifact);
                                    console.log(`Added artifact ${artifactId} to client model`);
                                } else {
                                    throw new Error('Artifact not found in API');
                                }
                            } catch (fetchError) {
                                console.error('Error fetching artifact:', fetchError);
                                throw new Error('Artifact not found');
                            }
                        }
                        
                        if (!artifact) {
                            throw new Error('Artifact not found');
                        }
                        
                        // Add the version to the client-side model
                        const clientVersionData = {
                            versionNumber: apiVersionData.versionNumber,
                            notes: apiVersionData.changes,
                            downloadUrl: apiVersionData.downloadUrl,
                            created: newVersionData.created || new Date().toISOString()
                        };
                        
                        const newVersion = window.App.models.artifact.addVersion(artifactId, clientVersionData);
                        console.log('Added version to client model:', newVersion);
                        
                        return newVersion;
                    } else {
                        throw new Error('Artifact model not available');
                    }
                } catch (error) {
                    console.error('Error in addVersion:', error);
                    throw error; // Re-throw the error to be handled by the caller
                }
            }
        }
    };
})();

export default ApiService;
