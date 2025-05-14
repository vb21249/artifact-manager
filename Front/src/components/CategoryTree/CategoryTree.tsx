import React, { useState } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  Collapse, 
  IconButton,
  styled,
  Badge,
  Box,
  Tooltip
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DragIndicator as DragIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Category } from '../../services/categoryService';
import DeleteCategoryDialog from './DeleteCategoryDialog';

const StyledListItem = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
}));

const DraggableTreeItem: React.FC<{
  category: Category;
  level: number;
  onDrop: (dragId: string, dropId: string) => void;
  onToggle: () => void;
  isExpanded: boolean;
  onAddSubcategory: (parentId: number) => void;
  onDeleteCategory: (category: Category) => void;
}> = ({ category, level, onDrop, onToggle, isExpanded, onAddSubcategory, onDeleteCategory }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'CATEGORY',
    item: { id: category.id.toString() },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'CATEGORY',
    drop: (item: { id: string }) => {
      onDrop(item.id, category.id.toString());
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const isDeleteDisabled = category.artifactsCount > 0 || (category.subcategories && category.subcategories.length > 0);

  return (
    <div ref={(node) => drag(drop(node))} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <StyledListItem
        sx={{
          pl: level * 2,
          backgroundColor: isOver ? 'action.hover' : 'transparent',
        }}
      >
        <DragIcon sx={{ mr: 1, cursor: 'move' }} />
        {category.subcategories && category.subcategories.length > 0 && (
          <IconButton size="small" onClick={onToggle}>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
        <Badge 
          badgeContent={category.artifactsCount} 
          color="primary"
          sx={{ '& .MuiBadge-badge': { right: -25 } }}
        >
          <ListItemText primary={category.name} />
        </Badge>
        <Box ml="auto" display="flex" alignItems="center">
          <Tooltip title="Add Subcategory">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onAddSubcategory(category.id);
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isDeleteDisabled ? "Cannot delete non-empty category" : "Delete Category"}>
            <span>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCategory(category);
                }}
                disabled={isDeleteDisabled}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </StyledListItem>
    </div>
  );
};

const CategoryTreeComponent: React.FC<{
  categories: Category[];
  onCategoryMove: (sourceId: string, targetId: string) => void;
  onAddSubcategory: (parentId: number) => void;
  onDeleteCategory: (category: Category) => void;
}> = ({ categories, onCategoryMove, onAddSubcategory, onDeleteCategory }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (categoryId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expandedItems.has(category.id.toString());

    return (
      <React.Fragment key={category.id}>
        <DraggableTreeItem
          category={category}
          level={level}
          onDrop={onCategoryMove}
          onToggle={() => toggleExpand(category.id.toString())}
          isExpanded={isExpanded}
          onAddSubcategory={onAddSubcategory}
          onDeleteCategory={onDeleteCategory}
        />
        {category.subcategories && category.subcategories.length > 0 && (
          <Collapse in={isExpanded}>
            <List disablePadding>
              {category.subcategories.map((child) => renderCategory(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <List>
        {categories.map((category) => renderCategory(category))}
      </List>
    </DndProvider>
  );
};

export default CategoryTreeComponent;
