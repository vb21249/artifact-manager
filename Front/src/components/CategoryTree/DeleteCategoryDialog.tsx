import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from '@mui/material';

interface DeleteCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName: string;
  loading: boolean;
  error: string | null;
}

const DeleteCategoryDialog: React.FC<DeleteCategoryDialogProps> = ({
  open,
  onClose,
  onConfirm,
  categoryName,
  loading,
  error,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Category</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography>
          Are you sure you want to delete the category "{categoryName}"?
          This action cannot be undone.
        </Typography>
        <Typography color="error" sx={{ mt: 2 }}>
          Note: You can only delete empty categories. Categories containing artifacts
          or subcategories cannot be deleted.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteCategoryDialog;
