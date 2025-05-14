import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { categoryService } from '../../services/categoryService';

interface AddCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  parentCategoryId?: number;
  onCategoryAdded: () => void;
}

const AddCategoryDialog: React.FC<AddCategoryDialogProps> = ({
  open,
  onClose,
  parentCategoryId,
  onCategoryAdded,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await categoryService.createCategory({
        name: name.trim(),
        parentCategoryId: parentCategoryId,
      });
      onCategoryAdded();
      onClose();
      setName('');
    } catch (err) {
      setError('Failed to create category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {parentCategoryId ? 'Add Subcategory' : 'Add Category'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
            inputProps={{ minLength: 3, maxLength: 100 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddCategoryDialog;
