using Xunit;
using Microsoft.EntityFrameworkCore;
using CourseWork.Infrastructure.Persistence;
using CourseWork.Domain.Entities;
using System.Linq;

namespace CourseWork.Tests
{
    public class RepositoryTests
    {
        private DbContextOptions<ArtifactsDbContext> GetInMemoryDbOptions()
        {
            return new DbContextOptionsBuilder<ArtifactsDbContext>()
                .UseInMemoryDatabase(databaseName: System.Guid.NewGuid().ToString())
                .Options;
        }

        [Fact]
        public void Add_ShouldAddEntityToDatabase()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new Repository<Category>(context);
            var category = new Category { Name = "Test Category" };

            // Act
            repository.Add(category);
            context.SaveChanges();

            // Assert
            Assert.Single(context.Categories);
            Assert.Equal("Test Category", context.Categories.First().Name);
        }

        [Fact]
        public void GetById_ShouldReturnCorrectEntity()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new Repository<Category>(context);
            var category = new Category { Name = "Test Category" };
            context.Categories.Add(category);
            context.SaveChanges();

            // Act
            var result = repository.GetById(category.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(category.Id, result.Id);
            Assert.Equal("Test Category", result.Name);
        }

        [Fact]
        public void GetAll_ShouldReturnAllEntities()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new Repository<Category>(context);
            var categories = new[]
            {
                new Category { Name = "Category 1" },
                new Category { Name = "Category 2" }
            };
            context.Categories.AddRange(categories);
            context.SaveChanges();

            // Act
            var result = repository.GetAll().ToList();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Contains(result, c => c.Name == "Category 1");
            Assert.Contains(result, c => c.Name == "Category 2");
        }

        [Fact]
        public void Update_ShouldUpdateEntity()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new Repository<Category>(context);
            var category = new Category { Name = "Original Name" };
            context.Categories.Add(category);
            context.SaveChanges();

            // Act
            category.Name = "Updated Name";
            repository.Update(category);
            context.SaveChanges();

            // Assert
            var updatedCategory = context.Categories.Find(category.Id);
            Assert.Equal("Updated Name", updatedCategory.Name);
        }

        [Fact]
        public void Delete_ShouldRemoveEntity()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new Repository<Category>(context);
            var category = new Category { Name = "Test Category" };
            context.Categories.Add(category);
            context.SaveChanges();

            // Act
            repository.Delete(category.Id);
            context.SaveChanges();

            // Assert
            Assert.Empty(context.Categories);
        }
    }
}
