using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using CourseWork.Application.Interfaces;
using CourseWork.Domain.Entities;

namespace CourseWork.Infrastructure.Persistence
{
    /// <summary>
    /// Implementation of the category repository with specific category-related operations.
    /// </summary>
    public class CategoryRepository : Repository<Category>, ICategoryRepository
    {
        public CategoryRepository(ArtifactsDbContext context) : base(context)
        {
        }

        public IEnumerable<Category> GetSubcategories(int categoryId)
        {
            return _dbSet.Where(c => c.ParentCategoryId == categoryId)
                        .Include(c => c.Subcategories)
                        .Include(c => c.Artifacts)
                        .ToList();
        }

        public void AddSubcategory(int parentId, Category category)
        {
            var parentCategory = _dbSet.Find(parentId);
            if (parentCategory != null)
            {
                category.ParentCategoryId = parentId;
                _dbSet.Add(category);
            }
        }

        public bool DeleteCategory(int id)
        {
            var category = _dbSet.Include(c => c.Subcategories)
                                .Include(c => c.Artifacts)
                                .FirstOrDefault(c => c.Id == id);

            if (category == null || !category.IsEmpty())
                return false;

            _dbSet.Remove(category);
            return true;
        }

        public void ModifyCategory(Category category)
        {
            var existingCategory = _dbSet.Find(category.Id);
            if (existingCategory != null)
            {
                _context.Entry(existingCategory).CurrentValues.SetValues(category);
            }
        }

        public void RearrangeCategory(int categoryId, int newPosition)
        {
            // Implementation would depend on how you want to handle category ordering
            // This could involve updating a Position property or changing ParentCategoryId
            var category = _dbSet.Find(categoryId);
            if (category != null)
            {
                // Implement the reordering logic based on your specific requirements
                _context.SaveChanges();
            }
        }

        public bool IsEmpty()
        {
            return !_dbSet.Any();
        }

        public override IEnumerable<Category> GetAll()
        {
            return _dbSet.Include(c => c.Subcategories)
                        .Include(c => c.Artifacts)
                        .ToList();
        }
    }
}
