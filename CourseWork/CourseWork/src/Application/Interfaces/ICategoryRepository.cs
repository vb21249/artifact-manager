using System.Collections.Generic;
using CourseWork.Domain.Entities;

namespace CourseWork.Application.Interfaces
{
    /// <summary>
    /// Interface for category-specific repository operations.
    /// </summary>
    public interface ICategoryRepository : IRepository<Category>
    {
        IEnumerable<Category> GetSubcategories(int categoryId);
        void AddSubcategory(int parentId, Category category);
        bool DeleteCategory(int id);
        void ModifyCategory(Category category);
        void RearrangeCategory(int categoryId, int newPosition);
        bool IsEmpty();
    }
}
