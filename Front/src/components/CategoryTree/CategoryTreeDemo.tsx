import React, { useState, useEffect } from 'react';
import CategoryTree from './CategoryTree';
import AddCategoryDialog from './AddCategoryDialog';
import DeleteCategoryDialog from './DeleteCategoryDialog';
import { Box, Typography, Paper, CircularProgress, Alert, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { categoryService, Category } from '../../services/categoryService';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import AddArtifactDialog from './AddArtifactDialog';
import DeleteArtifactDialog from './DeleteArtifactDialog';
import { artifactService } from '../../services/artifactService';

const CategoryTreeDemo: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<number | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [addArtifactDialogOpen, setAddArtifactDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [deleteArtifactDialogOpen, setDeleteArtifactDialogOpen] = useState(false);
  const [artifactToDelete, setArtifactToDelete] = useState<{id: number, name: string} | null>(null);
  const [deleteArtifactLoading, setDeleteArtifactLoading] = useState(false);
  const [deleteArtifactError, setDeleteArtifactError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError('Failed to load categories. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = (parentId?: number) => {
    setSelectedParentId(parentId);
    setAddDialogOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      await loadCategories();
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      setDeleteError('Failed to delete category. Make sure it is empty.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddArtifact = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setAddArtifactDialogOpen(true);
  };

  const handleDeleteArtifact = (artifactId: number, artifactName: string) => {
    setArtifactToDelete({ id: artifactId, name: artifactName });
    setDeleteArtifactDialogOpen(true);
    setDeleteArtifactError(null);
  };

  const handleConfirmDeleteArtifact = async () => {
    if (!artifactToDelete) return;

    setDeleteArtifactLoading(true);
    setDeleteArtifactError(null);

    try {
      await artifactService.deleteArtifact(artifactToDelete.id);
      await loadCategories();
      setDeleteArtifactDialogOpen(false);
      setArtifactToDelete(null);
    } catch (err) {
      setDeleteArtifactError('Failed to delete artifact.');
    } finally {
      setDeleteArtifactLoading(false);
    }
  };

  const handleCategoryMove = async (sourceId: string, targetId: string) => {
    try {
      console.log('Moving category:', { sourceId, targetId });
      const sourceCat = findCategory(parseInt(sourceId), categories);
      const targetCat = findCategory(parseInt(targetId), categories);
      
      if (!sourceCat || !targetCat) {
        throw new Error('Category not found');
      }

      // Don't allow moving a category into itself or its children
      if (isDescendant(targetCat, parseInt(sourceId))) {
        throw new Error('Cannot move a category into itself or its children');
      }

      // First update parent
      await categoryService.updateCategory(parseInt(sourceId), {
        name: sourceCat.name,
        parentCategoryId: parseInt(targetId)
      });

      // Get fresh data after parent update
      const updatedCategories = await categoryService.getCategories();
      const updatedTarget = findCategory(parseInt(targetId), updatedCategories);
      
      if (!updatedTarget) {
        throw new Error('Target category not found after update');
      }

      // Calculate position based on current siblings
      const siblings = updatedTarget.subcategories || [];
      const newPosition = siblings.length;

      // Update position
      await categoryService.rearrangeCategory(parseInt(sourceId), {
        newPosition: newPosition
      });

      await loadCategories();
    } catch (err) {
      console.error('Move error:', err);
      setError('Failed to move category. Please try again.');
    }
  };

  const handleArtifactMove = async (artifactId: number, targetCategoryId: number) => {
    try {
      console.log('Moving artifact:', { artifactId, targetCategoryId });
      
      // Update artifact's category
      await artifactService.updateArtifact(artifactId, {
        categoryId: targetCategoryId
      });

      await loadCategories();
    } catch (err) {
      console.error('Move artifact error:', err);
      setError('Failed to move artifact. Please try again.');
    }
  };

  const findCategory = (id: number, cats: Category[]): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) {
        return cat;
      }
      if (cat.subcategories) {
        const found = findCategory(id, cat.subcategories);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  const isDescendant = (category: Category, targetId: number): boolean => {
    if (category.id === targetId) {
      return true;
    }
    return category.subcategories?.some(subcat => isDescendant(subcat, targetId)) || false;
  };

  const handleArtifactAdded = async () => {
    await loadCategories();
    setAddArtifactDialogOpen(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2, m: 2 }}>
      <DndProvider backend={HTML5Backend}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Categories</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleAddCategory()}
          >
            Add Root Category
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <CategoryTree
          categories={categories}
          onCategoryMove={handleCategoryMove}
          onAddSubcategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onAddArtifact={handleAddArtifact}
          onDeleteArtifact={handleDeleteArtifact}
          onArtifactMove={handleArtifactMove}
        />

        <AddCategoryDialog
          open={addDialogOpen}
          onClose={() => {
            setAddDialogOpen(false);
            setSelectedParentId(undefined);
          }}
          onCategoryAdded={loadCategories}
          parentId={selectedParentId}
        />
        <DeleteCategoryDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={handleConfirmDelete}
          category={categoryToDelete}
          loading={deleteLoading}
          error={deleteError}
        />
        <AddArtifactDialog
          open={addArtifactDialogOpen}
          onClose={() => {
            setAddArtifactDialogOpen(false);
            setSelectedCategoryId(null);
          }}
          onArtifactAdded={handleArtifactAdded}
          categoryId={selectedCategoryId || 0}
        />
        <DeleteArtifactDialog
          open={deleteArtifactDialogOpen}
          onClose={() => {
            setDeleteArtifactDialogOpen(false);
            setArtifactToDelete(null);
            setDeleteArtifactError(null);
          }}
          onConfirm={handleConfirmDeleteArtifact}
          artifactName={artifactToDelete?.name || ''}
          loading={deleteArtifactLoading}
          error={deleteArtifactError}
        />
      </DndProvider>
    </Paper>
  );
};

export default CategoryTreeDemo;
