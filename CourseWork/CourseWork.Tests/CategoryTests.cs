using Xunit;
using CourseWork.Domain.Entities;
using System;
using System.Linq;

namespace CourseWork.Tests
{
    public class CategoryTests
    {
        [Fact]
        public void CreateCategory_WithNullParentId_ShouldBeValid()
        {
            // Arrange & Act
            var category = new Category
            {
                Id = 1,
                Name = "Root Category",
                ParentCategoryId = null,
                Position = 0,
                Path = "1"
            };

            // Assert
            Assert.Null(category.ParentCategoryId);
            Assert.Null(category.ParentCategory);
            Assert.Equal("Root Category", category.Name);
            Assert.Equal(0, category.Position);
            Assert.Equal("1", category.Path);
        }

        [Fact]
        public void AddSubcategory_ShouldSetParentCategoryId()
        {
            // Arrange
            var parentCategory = new Category
            {
                Id = 1,
                Name = "Parent",
                Path = "1"
            };

            var childCategory = new Category
            {
                Id = 2,
                Name = "Child"
            };

            // Act
            parentCategory.AddSubcategory(childCategory);

            // Assert
            Assert.Equal(1, childCategory.ParentCategoryId);
            Assert.Same(parentCategory, childCategory.ParentCategory);
            Assert.Equal(0, childCategory.Position);
            Assert.Contains(childCategory, parentCategory.Subcategories);
            Assert.Equal("1/2", childCategory.Path);
        }

        [Fact]
        public void AddSubcategory_WithNullCategory_ShouldThrowArgumentNullException()
        {
            // Arrange
            var parentCategory = new Category
            {
                Id = 1,
                Name = "Parent",
                Path = "1"
            };

            // Act & Assert
            var exception = Assert.Throws<ArgumentNullException>(() => parentCategory.AddSubcategory(null!));
            Assert.Equal("category", exception.ParamName);
        }

        [Fact]
        public void DeleteSubcategory_ShouldRemoveFromParent()
        {
            // Arrange
            var parentCategory = new Category
            {
                Id = 1,
                Name = "Parent",
                Path = "1"
            };

            var childCategory1 = new Category
            {
                Id = 2,
                Name = "Child1"
            };

            var childCategory2 = new Category
            {
                Id = 3,
                Name = "Child2"
            };

            parentCategory.AddSubcategory(childCategory1);
            parentCategory.AddSubcategory(childCategory2);

            // Act
            parentCategory.DeleteSubcategory(childCategory1);

            // Assert
            Assert.DoesNotContain(childCategory1, parentCategory.Subcategories);
            Assert.Contains(childCategory2, parentCategory.Subcategories);
            Assert.Equal(0, childCategory2.Position); // Position should be updated
        }

        [Fact]
        public void DeleteSubcategory_WithNullCategory_ShouldThrowArgumentNullException()
        {
            // Arrange
            var parentCategory = new Category
            {
                Id = 1,
                Name = "Parent",
                Path = "1"
            };

            // Act & Assert
            var exception = Assert.Throws<ArgumentNullException>(() => parentCategory.DeleteSubcategory(null!));
            Assert.Equal("category", exception.ParamName);
        }

        [Fact]
        public void UpdatePath_ShouldGenerateCorrectPath()
        {
            // Arrange
            var rootCategory = new Category
            {
                Id = 1,
                Name = "Root",
                Path = "1"
            };

            var middleCategory = new Category
            {
                Id = 2,
                Name = "Middle"
            };

            var leafCategory = new Category
            {
                Id = 3,
                Name = "Leaf"
            };

            // Act
            rootCategory.AddSubcategory(middleCategory);
            middleCategory.AddSubcategory(leafCategory);

            // Assert
            Assert.Equal("1", rootCategory.Path);
            Assert.Equal("1/2", middleCategory.Path);
            Assert.Equal("1/2/3", leafCategory.Path);
        }

        [Fact]
        public void GetLevel_ShouldReturnCorrectHierarchyLevel()
        {
            // Arrange
            var rootCategory = new Category
            {
                Id = 1,
                Name = "Root",
                Path = "1"
            };

            var middleCategory = new Category
            {
                Id = 2,
                Name = "Middle",
                Path = "1/2"
            };

            var leafCategory = new Category
            {
                Id = 3,
                Name = "Leaf",
                Path = "1/2/3"
            };

            rootCategory.AddSubcategory(middleCategory);
            middleCategory.AddSubcategory(leafCategory);

            // Act & Assert
            Assert.Equal(0, rootCategory.GetLevel());
            Assert.Equal(1, middleCategory.GetLevel());
            Assert.Equal(2, leafCategory.GetLevel());
        }
    }
}
