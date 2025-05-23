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
  Tooltip,
  Typography,
  Menu,
  MenuItem,
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DragIndicator as DragIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Category, Artifact } from '../../services/categoryService';

const StyledListItem = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
}));

const ArtifactItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1),
}));

const ArtifactContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
}));

const DraggableArtifact: React.FC<{
  artifact: Artifact;
  categoryId: number;
  onArtifactMove: (artifactId: number, targetCategoryId: number) => void;
  onDeleteArtifact: (artifactId: number, artifactName: string) => void;
}> = ({ artifact, categoryId, onArtifactMove, onDeleteArtifact }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'ARTIFACT',
    item: { id: artifact.id, sourceCategory: categoryId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <ArtifactItem
      ref={drag}
      sx={{ opacity: isDragging ? 0.5 : 1 }}
      key={artifact.id}
    >
      <ArtifactContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" component="div" fontWeight="medium">
            {artifact.title}
          </Typography>
          <Box>
            <Tooltip title="Open URL">
              <IconButton 
                size="small" 
                href={artifact.url} 
                target="_blank"
                sx={{ mr: 1 }}
              >
                <LinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Artifact">
              <IconButton
                size="small"
                onClick={() => onDeleteArtifact(artifact.id, artifact.title)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {artifact.description}
        </Typography>
      </ArtifactContent>
    </ArtifactItem>
  );
};

interface DraggableTreeItemProps {
  category: Category;
  level: number;
  onDrop: (dragId: string, dropId: string) => void;
  onToggle: () => void;
  isExpanded: boolean;
  onAddSubcategory: (parentId: number) => void;
  onDeleteCategory: (category: Category) => void;
  onAddArtifact: (categoryId: number) => void;
  onDeleteArtifact: (artifactId: number, artifactName: string) => void;
  onCategoryMove: (sourceId: string, targetId: string) => void;
  onArtifactMove: (artifactId: number, targetCategoryId: number) => void;
}

const DraggableTreeItem: React.FC<DraggableTreeItemProps> = ({ 
  category, 
  level, 
  onDrop, 
  onToggle, 
  isExpanded, 
  onAddSubcategory, 
  onDeleteCategory,
  onAddArtifact,
  onDeleteArtifact,
  onCategoryMove,
  onArtifactMove
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'CATEGORY',
    item: { id: category.id.toString() },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['CATEGORY', 'ARTIFACT'],
    drop: (item: { id: string | number, sourceCategory?: number }, monitor) => {
      if (monitor.didDrop()) {
        return;
      }
      if (monitor.getItemType() === 'CATEGORY') {
        onCategoryMove(item.id.toString(), category.id.toString());
      } else if (monitor.getItemType() === 'ARTIFACT' && typeof item.id === 'number') {
        onArtifactMove(item.id, category.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const isDeleteDisabled = (category.artifacts?.length ?? 0) > 0 || (category.subcategories?.length ?? 0) > 0;

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const shouldShowExpandIcon = (category.subcategories?.length ?? 0) > 0 || (category.artifacts?.length ?? 0) > 0;

  return (
    <div ref={(node) => drag(drop(node))} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <StyledListItem
        sx={{
          pl: level * 2,
          backgroundColor: isOver && canDrop ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
          borderLeft: isOver && canDrop ? '2px solid #1976d2' : 'none',
        }}
        onClick={shouldShowExpandIcon ? onToggle : undefined}
      >
        <DragIcon sx={{ mr: 1, cursor: 'move' }} />
        {shouldShowExpandIcon && (
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
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
          <IconButton
            size="small"
            onClick={handleMenuClick}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => {
              handleMenuClose();
              onAddSubcategory(category.id);
            }}>
              Add Subcategory
            </MenuItem>
            <MenuItem onClick={() => {
              handleMenuClose();
              onAddArtifact(category.id);
            }}>
              Add Artifact
            </MenuItem>
            <MenuItem 
              onClick={() => {
                handleMenuClose();
                onDeleteCategory(category);
              }}
              disabled={isDeleteDisabled}
              sx={{ color: 'error.main' }}
            >
              Delete Category
            </MenuItem>
          </Menu>
        </Box>
      </StyledListItem>

      <Collapse in={isExpanded}>
        <List disablePadding>
          {category.artifacts && category.artifacts.map((artifact) => (
            <DraggableArtifact
              key={artifact.id}
              artifact={artifact}
              categoryId={category.id}
              onArtifactMove={onArtifactMove}
              onDeleteArtifact={onDeleteArtifact}
            />
          ))}
          {category.subcategories && category.subcategories.map((subcategory) => (
            <CategoryTree
              key={subcategory.id}
              categories={[subcategory]}
              onCategoryMove={onCategoryMove}
              onAddSubcategory={onAddSubcategory}
              onDeleteCategory={onDeleteCategory}
              onAddArtifact={onAddArtifact}
              onDeleteArtifact={onDeleteArtifact}
              onArtifactMove={onArtifactMove}
              level={level + 1}
            />
          ))}
        </List>
      </Collapse>
    </div>
  );
};

interface CategoryTreeProps {
  categories: Category[];
  level?: number;
  onCategoryMove: (sourceId: string, targetId: string) => void;
  onAddSubcategory: (parentId: number) => void;
  onDeleteCategory: (category: Category) => void;
  onAddArtifact: (categoryId: number) => void;
  onDeleteArtifact: (artifactId: number, artifactName: string) => void;
  onArtifactMove: (artifactId: number, targetCategoryId: number) => void;
}

const CategoryTree: React.FC<CategoryTreeProps> = ({ 
  categories, 
  level = 0,
  onCategoryMove, 
  onAddSubcategory, 
  onDeleteCategory,
  onAddArtifact,
  onDeleteArtifact,
  onArtifactMove
}) => {
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
          onAddArtifact={onAddArtifact}
          onDeleteArtifact={onDeleteArtifact}
          onCategoryMove={onCategoryMove}
          onArtifactMove={onArtifactMove}
        />
      </React.Fragment>
    );
  };

  return (
    <List>
      {categories.map((category) => renderCategory(category, level))}
    </List>
  );
};

export default CategoryTree;
