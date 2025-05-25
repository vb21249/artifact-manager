// Artifact model functions
const ArtifactModel = (() => {
    // Private variables
    let artifacts = [];
    let selectedArtifactId = null;
    
    // Public methods
    return {
        getAll: () => artifacts,
        getSelected: () => selectedArtifactId,
        setSelected: (id) => {
            selectedArtifactId = id;
            return selectedArtifactId;
        },
        setArtifacts: (data) => {
            artifacts = data;
            return artifacts;
        },
        getById: (id) => artifacts.find(a => a.id === id),
        add: (artifact) => {
            artifacts.push(artifact);
            return artifact;
        },
        update: (id, updatedArtifact) => {
            const index = artifacts.findIndex(a => a.id === id);
            if (index !== -1) {
                artifacts[index] = updatedArtifact;
            }
            return updatedArtifact;
        },
        remove: (id) => {
            artifacts = artifacts.filter(a => a.id !== id);
            return true;
        },
        filter: (filters) => {
            let filtered = [...artifacts];
            
            // Filter by category
            if (filters.categoryId) {
                filtered = filtered.filter(a => a.categoryId === filters.categoryId);
            }
            
            // Filter by search term
            if (filters.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                filtered = filtered.filter(a => 
                    a.title.toLowerCase().includes(term) || 
                    (a.description && a.description.toLowerCase().includes(term))
                );
            }
            
            // Filter by language
            if (filters.language) {
                filtered = filtered.filter(a => a.programmingLanguage === filters.language);
            }
            
            // Filter by framework
            if (filters.framework) {
                filtered = filtered.filter(a => a.framework === filters.framework);
            }
            
            // Filter by license
            if (filters.license) {
                filtered = filtered.filter(a => a.licenseType === filters.license);
            }
            
            return filtered;
        },
        getUniqueLanguages: () => [...new Set(artifacts.map(a => a.programmingLanguage).filter(Boolean))],
        getUniqueFrameworks: () => [...new Set(artifacts.map(a => a.framework).filter(Boolean))],
        getUniqueLicenses: () => [...new Set(artifacts.map(a => a.licenseType).filter(Boolean))],
        
        // Version management
        getVersions: (artifactId) => {
            const artifact = artifacts.find(a => a.id === artifactId);
            return artifact?.versions || [];
        },
        
        addVersion: (artifactId, versionData) => {
            const artifact = artifacts.find(a => a.id === artifactId);
            if (!artifact) return null;
            
            // Initialize versions array if it doesn't exist
            if (!artifact.versions) {
                artifact.versions = [];
            }
            
            // Add created timestamp
            const newVersion = {
                ...versionData,
                created: new Date().toISOString()
            };
            
            // Add to versions array
            artifact.versions.push(newVersion);
            
            // Update the artifact's current version
            artifact.currentVersion = versionData.versionNumber;
            
            return newVersion;
        }
    };
})();

export default ArtifactModel;
