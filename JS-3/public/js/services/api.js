// API service for handling all server communication
const ApiService = (() => {
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
                    handleError(error, `Error updating category ${id}`);
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
                    console.log('Versions endpoint not implemented in API, returning empty array');
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
                    const response = await fetch(`${API_BASE}/artifacts/${artifactId}/versions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(versionData)
                    });
                    
                    if (!response.ok) throw new Error('Failed to add version');
                    return await response.json();
                } catch (error) {
                    handleError(error, `Error adding version to artifact ${artifactId}`);
                    return null;
                }
            }
        }
    };
})();

export default ApiService;
