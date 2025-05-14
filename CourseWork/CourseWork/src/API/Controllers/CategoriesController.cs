using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CourseWork.API.DTOs;
using CourseWork.Application.Interfaces;
using CourseWork.Domain.Entities;

namespace CourseWork.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Tags("Categories")]
    public class CategoriesController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public CategoriesController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        /// <summary>
        /// Gets all categories with their hierarchy
        /// </summary>
        /// <returns>List of categories with their subcategories</returns>
        /// <response code="200">Returns the list of categories</response>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<CategoryDto>), 200)]
        public IActionResult GetCategories()
        {
            var categories = _unitOfWork.CategoryRepository.GetAll()
                .Where(c => c.ParentCategoryId == null)
                .Select(MapToCategoryDto);

            return Ok(categories);
        }

        /// <summary>
        /// Gets a specific category by id
        /// </summary>
        /// <param name="id">The ID of the category</param>
        /// <returns>The category details</returns>
        /// <response code="200">Returns the category</response>
        /// <response code="404">If the category is not found</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(CategoryDto), 200)]
        [ProducesResponseType(404)]
        public IActionResult GetCategory(int id)
        {
            var category = _unitOfWork.CategoryRepository.GetById(id);
            if (category == null)
                return NotFound();

            return Ok(MapToCategoryDto(category));
        }

        /// <summary>
        /// Creates a new category
        /// </summary>
        /// <param name="dto">The category creation data</param>
        /// <returns>The created category</returns>
        /// <response code="201">Returns the newly created category</response>
        /// <response code="400">If the category data is invalid</response>
        [HttpPost]
        [ProducesResponseType(typeof(CategoryDto), 201)]
        [ProducesResponseType(400)]
        public IActionResult CreateCategory([FromBody] CreateCategoryDto dto)
        {
            var category = new Category { 
                Name = dto.Name,
                Path = dto.ParentCategoryId.HasValue ? "temp" : dto.Name.ToLowerInvariant() // Temporary path for child categories
            };
            
            if (dto.ParentCategoryId.HasValue)
            {
                var parentCategory = _unitOfWork.CategoryRepository.GetById(dto.ParentCategoryId.Value);
                if (parentCategory == null)
                    return BadRequest("Parent category not found");
                
                parentCategory.AddSubcategory(category);
            }
            else
            {
                _unitOfWork.CategoryRepository.Add(category);
                // For root categories, initialize Path after adding to get the ID
                _unitOfWork.Save();
                category.Path = category.Id.ToString();
                _unitOfWork.Save();
            }

            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, MapToCategoryDto(category));
        }

        /// <summary>
        /// Updates a category
        /// </summary>
        /// <param name="id">The ID of the category to update</param>
        /// <param name="dto">The category update data</param>
        /// <returns>No content</returns>
        /// <response code="204">If the category was updated</response>
        /// <response code="404">If the category was not found</response>
        [HttpPut("{id}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        public IActionResult UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
        {
            var category = _unitOfWork.CategoryRepository.GetById(id);
            if (category == null)
                return NotFound();

            category.ModifyCategory(dto.Name);
            _unitOfWork.Save();

            return NoContent();
        }

        /// <summary>
        /// Deletes a category
        /// </summary>
        /// <param name="id">The ID of the category to delete</param>
        /// <returns>No content</returns>
        /// <response code="204">If the category was deleted</response>
        /// <response code="404">If the category was not found</response>
        /// <response code="400">If the category is not empty</response>
        [HttpDelete("{id}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        [ProducesResponseType(400)]
        public IActionResult DeleteCategory(int id)
        {
            var category = _unitOfWork.CategoryRepository.GetById(id);
            if (category == null)
                return NotFound();

            if (!category.IsEmpty())
                return BadRequest("Cannot delete non-empty category");

            _unitOfWork.CategoryRepository.Delete(id);
            _unitOfWork.Save();

            return NoContent();
        }

        /// <summary>
        /// Rearranges a category within its level
        /// </summary>
        /// <param name="id">The ID of the category to rearrange</param>
        /// <param name="dto">The new position data</param>
        /// <returns>No content</returns>
        /// <response code="204">If the category was rearranged</response>
        /// <response code="404">If the category was not found</response>
        /// <response code="400">If the new position is invalid</response>
        [HttpPatch("{id}/position")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        [ProducesResponseType(400)]
        public IActionResult RearrangeCategory(int id, [FromBody] RearrangeCategoryDto dto)
        {
            var category = _unitOfWork.CategoryRepository.GetById(id);
            if (category == null)
                return NotFound();

            try
            {
                category.Rearrange(dto.NewPosition);
                _unitOfWork.Save();
                return NoContent();
            }
            catch (System.ArgumentOutOfRangeException)
            {
                return BadRequest("Invalid position");
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private static CategoryDto MapToCategoryDto(Category category)
        {
            return new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                ParentCategoryId = category.ParentCategoryId,
                Position = category.Position,
                Path = category.Path,
                Subcategories = category.Subcategories.Select(MapToCategoryDto).ToList(),
                ArtifactsCount = category.Artifacts.Count
            };
        }
    }
}
