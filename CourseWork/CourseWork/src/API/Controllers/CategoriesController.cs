using Microsoft.AspNetCore.Mvc;
using CourseWork.Domain.Entities;
using CourseWork.Application.Interfaces;
using CourseWork.API.DTOs;
using System;
using System.Linq;
using System.Collections.Generic;
using API.DTOs;

namespace CourseWork.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public CategoriesController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public IActionResult GetCategories()
        {
            try
            {
                var categories = _unitOfWork.CategoryRepository.GetAll()
                    .Where(c => c.ParentCategoryId == null)
                    .OrderBy(c => c.Position)
                    .ToList();

                var result = categories.Select(c => MapToCategoryDto(c, true)).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving categories", error = ex.Message });
            }
        }

        private CategoryDto MapToCategoryDto(Category category, bool includeChildren = false)
        {
            var dto = new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                ParentCategoryId = category.ParentCategoryId,
                Position = category.Position,
                Path = category.Path,
                ArtifactsCount = _unitOfWork.SoftwareDevArtifactRepository.GetAll().Count(a => a.CategoryId == category.Id)
            };

            // Get artifacts for this category
            dto.Artifacts = _unitOfWork.SoftwareDevArtifactRepository.GetAll()
                .Where(a => a.CategoryId == category.Id)
                .Select(a => new ArtifactDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    Url = a.Url,
                    DocumentationType = a.DocumentationType,
                    Author = a.Author,
                    CurrentVersion = a.CurrentVersion,
                    ProgrammingLanguage = a.ProgrammingLanguage,
                    Framework = a.Framework,
                    LicenseType = a.LicenseType,
                    CategoryId = a.CategoryId,
                })
                .ToList();

            if (includeChildren)
            {
                var children = _unitOfWork.CategoryRepository.GetAll()
                    .Where(c => c.ParentCategoryId == category.Id)
                    .OrderBy(c => c.Position)
                    .ToList();

                dto.Subcategories = children.Select(c => MapToCategoryDto(c, true)).ToList();
            }

            return dto;
        }

        [HttpGet("{id}")]
        public IActionResult GetCategory(int id)
        {
            try
            {
                var category = _unitOfWork.CategoryRepository.GetById(id);
                if (category == null) return NotFound();

                var dto = MapToCategoryDto(category, true);
                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the category", error = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult CreateCategory([FromBody] CreateCategoryDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var category = new Category
                {
                    Name = dto.Name,
                    ParentCategoryId = dto.ParentCategoryId,
                    Position = dto.Position
                };

                if (dto.ParentCategoryId.HasValue)
                {
                    var parent = _unitOfWork.CategoryRepository.GetById(dto.ParentCategoryId.Value);
                    if (parent == null)
                        return BadRequest(new { message = "Parent category not found" });
                    category.Path = $"{parent.Path}/{category.Name}";
                }
                else
                {
                    category.Path = category.Name;
                }

                _unitOfWork.CategoryRepository.Add(category);
                _unitOfWork.Save();

                var result = MapToCategoryDto(category);
                return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the category", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public IActionResult UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var category = _unitOfWork.CategoryRepository.GetById(id);
                if (category == null) return NotFound();

                category.Name = dto.Name;
                category.Position = dto.Position;

                // Update path for this category and all its children
                if (category.ParentCategoryId.HasValue)
                {
                    var parent = _unitOfWork.CategoryRepository.GetById(category.ParentCategoryId.Value);
                    category.Path = $"{parent.Path}/{category.Name}";
                }
                else
                {
                    category.Path = category.Name;
                }

                _unitOfWork.Save();

                var result = MapToCategoryDto(category);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the category", error = ex.Message });
            }
        }

        [HttpPut("{id}/position")]
        public IActionResult UpdateCategoryPosition(int id, [FromBody] UpdateCategoryPositionRequest request)
        {
            try
            {
                var category = _unitOfWork.CategoryRepository.GetById(id);
                if (category == null)
                    return NotFound($"Category with ID {id} not found");

                category.Position = request.Position;
                _unitOfWork.Save();

                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the category position", error = ex.Message });
            }
        }

        [HttpPut("{id}/move-to")]
        public IActionResult MoveCategoryTo(int id, [FromBody] MoveCategoryToRequest request)
        {
            try
            {
                var category = _unitOfWork.CategoryRepository.GetById(id);
                if (category == null)
                    return NotFound(new { message = $"Category with ID {id} not found" });

                var targetCategory = _unitOfWork.CategoryRepository.GetById(request.NewParentId);
                if (targetCategory == null)
                    return NotFound(new { message = $"Target category with ID {request.NewParentId} not found" });

                // Check if target is not a descendant of the category being moved
                if (targetCategory.Path.StartsWith(category.Path))
                    return BadRequest(new { message = "Cannot move a category into its own descendant" });

                // Get all categories in the target parent to manage positions
                var siblingCategories = _unitOfWork.CategoryRepository.GetAll()
                    .Where(c => c.ParentCategoryId == request.NewParentId && c.Id != id)
                    .OrderBy(c => c.Position)
                    .ToList();

                // Update the category's parent
                var oldParentId = category.ParentCategoryId;
                category.ParentCategoryId = request.NewParentId;
                
                // Handle position if specified
                if (request.Position.HasValue)
                {
                    int newPosition = Math.Min(request.Position.Value, siblingCategories.Count);
                    newPosition = Math.Max(0, newPosition); // Ensure position is not negative
                    
                    // Update positions of other categories in the parent
                    foreach (var c in siblingCategories)
                    {
                        if (c.Position >= newPosition)
                        {
                            c.Position++;
                        }
                    }
                    
                    category.Position = newPosition;
                }
                else
                {
                    // If no position specified, put at the end
                    category.Position = siblingCategories.Count;
                }

                // Update the path for this category and all its descendants
                string oldPath = category.Path;
                category.Path = targetCategory.Path + "." + category.Id;

                // Update paths of all descendants
                var descendants = _unitOfWork.CategoryRepository.GetAll()
                    .Where(c => c.Path.StartsWith(oldPath + "."))
                    .ToList();

                foreach (var descendant in descendants)
                {
                    descendant.Path = descendant.Path.Replace(oldPath, category.Path);
                }

                _unitOfWork.CategoryRepository.Update(category);
                _unitOfWork.Save();

                // Return the updated category tree
                var updatedCategories = _unitOfWork.CategoryRepository.GetAll()
                    .Where(c => c.ParentCategoryId == null)
                    .OrderBy(c => c.Position)
                    .ToList();

                var result = updatedCategories.Select(c => MapToCategoryDto(c, true)).ToList();

                return Ok(new { 
                    message = "Category moved successfully",
                    categories = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while moving the category", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteCategory(int id)
        {
            try
            {
                var category = _unitOfWork.CategoryRepository.GetById(id);
                if (category == null) return NotFound();

                // Delete all artifacts in this category
                var artifacts = _unitOfWork.SoftwareDevArtifactRepository.GetAll()
                    .Where(a => a.CategoryId == id)
                    .ToList();
                
                foreach (var artifact in artifacts)
                {
                    _unitOfWork.SoftwareDevArtifactRepository.Delete(artifact.Id);
                }

                // Delete all subcategories recursively
                DeleteSubcategories(id);

                _unitOfWork.CategoryRepository.Delete(id);
                _unitOfWork.Save();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the category", error = ex.Message });
            }
        }

        private void DeleteSubcategories(int parentId)
        {
            var subcategories = _unitOfWork.CategoryRepository.GetAll()
                .Where(c => c.ParentCategoryId == parentId)
                .ToList();

            foreach (var subcategory in subcategories)
            {
                // Delete all artifacts in this subcategory
                var artifacts = _unitOfWork.SoftwareDevArtifactRepository.GetAll()
                    .Where(a => a.CategoryId == subcategory.Id)
                    .ToList();
                
                foreach (var artifact in artifacts)
                {
                    _unitOfWork.SoftwareDevArtifactRepository.Delete(artifact.Id);
                }

                // Recursively delete subcategories
                DeleteSubcategories(subcategory.Id);

                _unitOfWork.CategoryRepository.Delete(subcategory.Id);
            }
        }
    }
}
