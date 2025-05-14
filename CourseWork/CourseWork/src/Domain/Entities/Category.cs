using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace CourseWork.Domain.Entities
{
    /// <summary>
    /// Represents a category in the software development artifacts hierarchy.
    /// Categories can have subcategories and contain software development artifacts.
    /// </summary>
    public class Category
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        // Navigation property for hierarchical structure
        public int? ParentCategoryId { get; set; }
        public virtual Category ParentCategory { get; set; }

        // Position within the current level for manual ordering
        public int Position { get; set; }

        // Hierarchical path for efficient traversal
        [StringLength(1000)]
        public string Path { get; set; }

        // Collection navigation properties
        public virtual ICollection<Category> Subcategories { get; set; } = new List<Category>();
        public virtual ICollection<SoftwareDevArtifact> Artifacts { get; set; } = new List<SoftwareDevArtifact>();

        // Methods for category management
        public void AddSubcategory(Category category)
        {
            if (category == null) throw new ArgumentNullException(nameof(category));
            
            category.ParentCategory = this;
            category.ParentCategoryId = this.Id;
            category.Position = Subcategories.Count;
            category.UpdatePath();
            
            Subcategories.Add(category);
        }

        public void DeleteSubcategory(Category category)
        {
            if (category == null) throw new ArgumentNullException(nameof(category));
            if (!category.IsEmpty())
                throw new InvalidOperationException("Cannot delete non-empty category");

            Subcategories.Remove(category);
            ReorderSubcategories();
        }

        public void ModifyCategory(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Category name cannot be empty", nameof(name));
            
            Name = name;
            UpdatePath();
            UpdateSubcategoriesPaths();
        }

        public bool IsEmpty()
        {
            return !Subcategories.Any() && !Artifacts.Any();
        }

        public void UpdatePath()
        {
            if (ParentCategory == null)
            {
                Path = Id.ToString();
            }
            else
            {
                Path = $"{ParentCategory.Path}/{Id}";
            }
        }

        private void UpdateSubcategoriesPaths()
        {
            foreach (var subcategory in Subcategories)
            {
                subcategory.UpdatePath();
                subcategory.UpdateSubcategoriesPaths();
            }
        }

        private void ReorderSubcategories()
        {
            var orderedSubcategories = Subcategories.OrderBy(c => c.Position).ToList();
            for (int i = 0; i < orderedSubcategories.Count; i++)
            {
                orderedSubcategories[i].Position = i;
            }
        }

        public void Rearrange(int newPosition)
        {
            if (ParentCategory == null)
                throw new InvalidOperationException("Cannot rearrange root category");

            var siblings = ParentCategory.Subcategories.OrderBy(c => c.Position).ToList();
            var maxPosition = siblings.Count - 1;
            
            if (newPosition < 0 || newPosition > maxPosition)
                throw new ArgumentOutOfRangeException(nameof(newPosition));

            // Remove from current position
            siblings.Remove(this);
            
            // Insert at new position
            siblings.Insert(newPosition, this);
            
            // Update positions for all siblings
            for (int i = 0; i < siblings.Count; i++)
            {
                siblings[i].Position = i;
            }
        }

        public int GetLevel()
        {
            return Path?.Count(c => c == '/') ?? 0;
        }
    }
}
