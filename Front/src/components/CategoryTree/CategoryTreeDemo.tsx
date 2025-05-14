import React, { useState, useEffect } from 'react';
import CategoryTreeComponent from './CategoryTree';
import AddCategoryDialog from './AddCategoryDialog';
import DeleteCategoryDialog from './DeleteCategoryDialog';
import { Box, Typography, Paper, CircularProgress, Alert, Button, Stack } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { categoryService, Category } from '../../services/categoryService';

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

  const handleCategoryMove = async (sourceId: string, targetId: string) => {
    try {
      const sourceCat = findCategory(parseInt(sourceId), categories);
      const targetCat = findCategory(parseInt(targetId), categories);
      
      if (!sourceCat || !targetCat) {
        throw new Error('Category not found');
      }

      // If moving to a new parent
      if (sourceCat.parentCategoryId !== targetCat.id) {
        await categoryService.updateCategory(parseInt(sourceId), {
          name: sourceCat.name,
        });
      }

      // Update position within the new parent's children
      const newPosition = targetCat.subcategories ? targetCat.subcategories.length : 0;
      await categoryService.rearrangeCategory(parseInt(sourceId), {
        newPosition: newPosition,
      });

      // Reload categories to get the updated structure
      await loadCategories();
    } catch (err) {
      setError('Failed to move category. Please try again.');
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2, m: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            Category Manager
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleAddCategory()}
          >
            Add Category
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Drag and drop categories to reorganize. Click arrows to expand/collapse.
        </Typography>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <CategoryTreeComponent
        categories={categories}
        onCategoryMove={handleCategoryMove}
        onAddSubcategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />
      <AddCategoryDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        parentCategoryId={selectedParentId}
        onCategoryAdded={loadCategories}
      />
      <DeleteCategoryDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setCategoryToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        categoryName={categoryToDelete?.name || ''}
        loading={deleteLoading}
        error={deleteError}
      />
    </Paper>
  );
};

export default CategoryTreeDemo;
