using Xunit;
using Microsoft.EntityFrameworkCore;
using CourseWork.Infrastructure.Persistence;
using CourseWork.Domain.Entities;
using System.Linq;

namespace CourseWork.Tests
{
    public class CategoryRepositoryTests
    {
        private DbContextOptions<ArtifactsDbContext> GetInMemoryDbOptions()
        {
            return new DbContextOptionsBuilder<ArtifactsDbContext>()
                .UseInMemoryDatabase(databaseName: System.Guid.NewGuid().ToString())
                .Options;
        }

        [Fact]
        public void GetSubcategories_ShouldReturnCorrectSubcategories()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new CategoryRepository(context);
            
            var parentCategory = new Category { Name = "Parent", Path = "/1" };
            context.Categories.Add(parentCategory);
            context.SaveChanges();

            var subcategories = new[]
            {
                new Category { Name = "Sub1", ParentCategoryId = parentCategory.Id, Path = "/1/1" },
                new Category { Name = "Sub2", ParentCategoryId = parentCategory.Id, Path = "/1/2" }
            };
            context.Categories.AddRange(subcategories);
            context.SaveChanges();

            // Act
            var result = repository.GetSubcategories(parentCategory.Id).ToList();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, c => Assert.Equal(parentCategory.Id, c.ParentCategoryId));
        }

        [Fact]
        public void AddSubcategory_ShouldAddSubcategoryWithCorrectParent()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new CategoryRepository(context);
            
            var parentCategory = new Category { Name = "Parent", Path = "/1" };
            context.Categories.Add(parentCategory);
            context.SaveChanges();

            var subcategory = new Category { Name = "Subcategory", Path = "/1/1" };

            // Act
            repository.AddSubcategory(parentCategory.Id, subcategory);
            context.SaveChanges();

            // Assert
            var result = context.Categories.Find(subcategory.Id);
            Assert.NotNull(result);
            Assert.Equal(parentCategory.Id, result.ParentCategoryId);
        }

        [Fact]
        public void DeleteCategory_ShouldReturnFalseWhenCategoryHasSubcategories()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new CategoryRepository(context);
            
            var parentCategory = new Category { Name = "Parent", Path = "/1" };
            context.Categories.Add(parentCategory);
            var subcategory = new Category { Name = "Sub", ParentCategoryId = parentCategory.Id, Path = "/1/1" };
            context.Categories.Add(subcategory);
            context.SaveChanges();

            // Act
            var result = repository.DeleteCategory(parentCategory.Id);

            // Assert
            Assert.False(result);
            Assert.NotNull(context.Categories.Find(parentCategory.Id));
        }

        [Fact]
        public void DeleteCategory_ShouldReturnTrueAndDeleteWhenCategoryIsEmpty()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new CategoryRepository(context);
            
            var category = new Category { Name = "Test", Path = "/1" };
            context.Categories.Add(category);
            context.SaveChanges();

            // Act
            var result = repository.DeleteCategory(category.Id);
            context.SaveChanges();

            // Create a new context to verify deletion
            using var newContext = new ArtifactsDbContext(options);
            var deletedCategory = newContext.Categories.Find(category.Id);

            // Assert
            Assert.True(result);
            Assert.Null(deletedCategory);
        }

        [Fact]
        public void ModifyCategory_ShouldUpdateCategoryProperties()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new CategoryRepository(context);
            
            var category = new Category { Name = "Original", Path = "/1" };
            context.Categories.Add(category);
            context.SaveChanges();

            // Act
            category.Name = "Modified";
            repository.ModifyCategory(category);
            context.SaveChanges();

            // Assert
            var result = context.Categories.Find(category.Id);
            Assert.Equal("Modified", result.Name);
        }

        [Fact]
        public void IsEmpty_ShouldReturnTrueWhenNoCategories()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new CategoryRepository(context);

            // Act
            var result = repository.IsEmpty();

            // Assert
            Assert.True(result);
        }

        [Fact]
        public void IsEmpty_ShouldReturnFalseWhenCategoriesExist()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new CategoryRepository(context);
            
            context.Categories.Add(new Category { Name = "Test", Path = "/1" });
            context.SaveChanges();

            // Act
            var result = repository.IsEmpty();

            // Assert
            Assert.False(result);
        }
    }
}
