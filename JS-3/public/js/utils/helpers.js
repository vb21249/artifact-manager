// Utility functions for the application
const Utils = {
    // Format a date string
    formatDate: (dateString) => {
        if (!dateString) return 'Unknown date';
        
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    // Show an error message
    showError: (message) => {
        // You could implement a toast notification here
        alert(message);
    },
    
    // Clear all drop targets
    clearDropTargets: () => {
        document.querySelectorAll('.drop-target').forEach(element => {
            element.classList.remove('drop-target');
        });
    }
};

export default Utils;
