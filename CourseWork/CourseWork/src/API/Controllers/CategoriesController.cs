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
