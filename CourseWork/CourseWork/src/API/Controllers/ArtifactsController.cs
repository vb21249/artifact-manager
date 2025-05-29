using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using CourseWork.API.DTOs;
using CourseWork.Application.Interfaces;
using CourseWork.Domain.Entities;
using CourseWork.Domain.Entities.Validation;

namespace CourseWork.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Tags("Artifacts")]
    public class ArtifactsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ArtifactMetadataValidator _validator;

        public ArtifactsController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
            _validator = new ArtifactMetadataValidator();
        }

        /// <summary>
        /// Gets all artifacts
        /// </summary>
        /// <returns>List of artifacts</returns>
        /// <response code="200">Returns the list of artifacts</response>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<ArtifactDto>), 200)]
        public IActionResult GetArtifacts()
        {
            try
            {
                var artifacts = _unitOfWork.SoftwareDevArtifactRepository.GetAll();
                return Ok(artifacts.Select(MapToArtifactDto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving artifacts", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets a specific artifact by id
        /// </summary>
        /// <param name="id">The ID of the artifact</param>
        /// <returns>The artifact details</returns>
        /// <response code="200">Returns the artifact</response>
        /// <response code="404">If the artifact is not found</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ArtifactDto), 200)]
        [ProducesResponseType(404)]
        public IActionResult GetArtifact(int id)
        {
            var artifact = _unitOfWork.SoftwareDevArtifactRepository.GetById(id);
            if (artifact == null)
                return NotFound();

            return Ok(MapToArtifactDto(artifact));
        }

        /// <summary>
        /// Creates a new artifact
        /// </summary>
        /// <param name="dto">The artifact creation data</param>
        /// <returns>The created artifact</returns>
        /// <response code="201">Returns the newly created artifact</response>
        /// <response code="400">If the artifact data is invalid</response>
        [HttpPost]
        [ProducesResponseType(typeof(ArtifactDto), 201)]
        [ProducesResponseType(400)]
        public IActionResult CreateArtifact([FromBody] CreateArtifactDto dto)
        {
            try
            {
                // Validate the category exists
                var category = _unitOfWork.CategoryRepository.GetById(dto.CategoryId);
                if (category == null)
                    return BadRequest(new { message = $"Category with ID {dto.CategoryId} not found" });

                // Get the count of artifacts in this category for positioning
                var artifactCount = _unitOfWork.SoftwareDevArtifactRepository.GetAll()
                    .Count(a => a.CategoryId == dto.CategoryId);

                var artifact = new SoftwareDevArtifact
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    Url = dto.Url,
                    DocumentationType = dto.DocumentationType,
                    Created = DateTime.UtcNow,
                    Author = dto.Author,
                    CurrentVersion = dto.CurrentVersion,
                    ProgrammingLanguage = dto.ProgrammingLanguage,
                    Framework = dto.Framework,
                    LicenseType = dto.LicenseType,
                    CategoryId = dto.CategoryId,
                    Position = artifactCount // Set position to end of list
                };

                var validationResult = _validator.Validate(artifact);
                if (!validationResult.IsValid)
                    return BadRequest(validationResult.Errors);

                _unitOfWork.SoftwareDevArtifactRepository.Add(artifact);
                _unitOfWork.Save();

                return CreatedAtAction(nameof(GetArtifact), new { id = artifact.Id }, MapToArtifactDto(artifact));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the artifact", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates an artifact
        /// </summary>
        /// <param name="id">The ID of the artifact to update</param>
        /// <param name="dto">The artifact update data</param>
        /// <returns>No content</returns>
        /// <response code="204">If the artifact was updated</response>
        /// <response code="404">If the artifact was not found</response>
        /// <response code="400">If the update data is invalid</response>
        [HttpPut("{id}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        [ProducesResponseType(400)]
        public IActionResult UpdateArtifact(int id, [FromBody] UpdateArtifactDto dto)
        {
            var artifact = _unitOfWork.SoftwareDevArtifactRepository.GetById(id);
            if (artifact == null)
                return NotFound();

            artifact.Title = dto.Title;
            artifact.Description = dto.Description;
            artifact.Url = dto.Url;
            artifact.ProgrammingLanguage = dto.ProgrammingLanguage;
            artifact.Framework = dto.Framework;
            artifact.LicenseType = dto.LicenseType;

            var validationResult = _validator.Validate(artifact);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors);

            _unitOfWork.SoftwareDevArtifactRepository.Update(artifact);
            _unitOfWork.Save();

            return NoContent();
        }

        /// <summary>
        /// Deletes an artifact
        /// </summary>
        /// <param name="id">The ID of the artifact to delete</param>
        /// <returns>No content</returns>
        /// <response code="204">If the artifact was deleted</response>
        /// <response code="404">If the artifact was not found</response>
        [HttpDelete("{id}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        public IActionResult DeleteArtifact(int id)
        {
            var artifact = _unitOfWork.SoftwareDevArtifactRepository.GetById(id);
            if (artifact == null)
                return NotFound();

            _unitOfWork.SoftwareDevArtifactRepository.Delete(id);
            _unitOfWork.Save();

            return NoContent();
        }

        /// <summary>
        /// Adds a new version to an artifact
        /// </summary>
        /// <param name="id">The ID of the artifact</param>
        /// <param name="dto">The version data</param>
        /// <returns>The created version</returns>
        /// <response code="201">Returns the newly created version</response>
        /// <response code="404">If the artifact is not found</response>
        /// <response code="400">If the version data is invalid</response>
        [HttpPost("{id}/versions")]
        [ProducesResponseType(typeof(ArtifactVersionDto), 201)]
        [ProducesResponseType(404)]
        [ProducesResponseType(400)]
        public IActionResult AddVersion(int id, [FromBody] CreateArtifactVersionDto dto)
        {
            var artifact = _unitOfWork.SoftwareDevArtifactRepository.GetById(id);
            if (artifact == null)
                return NotFound();

            var version = new ArtifactVersion
            {
                VersionNumber = dto.VersionNumber,
                UpdateDate = DateTime.UtcNow,
                Changes = dto.Changes,
                DownloadUrl = dto.DownloadUrl
            };

            _unitOfWork.SoftwareDevArtifactRepository.AddVersion(id, version);
            _unitOfWork.Save();

            return CreatedAtAction(nameof(GetArtifact), new { id = artifact.Id }, MapToVersionDto(version));
        }

        /// <summary>
        /// Gets the version history of an artifact
        /// </summary>
        /// <param name="id">The ID of the artifact</param>
        /// <returns>List of versions</returns>
        /// <response code="200">Returns the list of versions</response>
        /// <response code="404">If the artifact is not found</response>
        [HttpGet("{id}/versions")]
        [ProducesResponseType(typeof(IEnumerable<ArtifactVersionDto>), 200)]
        [ProducesResponseType(404)]
        public IActionResult GetVersionHistory(int id)
        {
            var artifact = _unitOfWork.SoftwareDevArtifactRepository.GetById(id);
            if (artifact == null)
                return NotFound();

            var versions = _unitOfWork.SoftwareDevArtifactRepository
                .GetVersionHistory(id)
                .Select(MapToVersionDto);

            return Ok(versions);
        }

        /// <summary>
        /// Searches artifacts by text query
        /// </summary>
        /// <param name="query">The search query</param>
        /// <returns>List of matching artifacts</returns>
        /// <response code="200">Returns the list of matching artifacts</response>
        [HttpGet("search")]
        [ProducesResponseType(typeof(IEnumerable<ArtifactDto>), 200)]
        public IActionResult SearchArtifacts([FromQuery] string query)
        {
            try
            {
                var artifacts = _unitOfWork.SoftwareDevArtifactRepository.Search(query);
                return Ok(artifacts.Select(MapToArtifactDto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while searching artifacts", error = ex.Message });
            }
        }

        /// <summary>
        /// Filters artifacts by programming language
        /// </summary>
        /// <param name="language">The programming language to filter by</param>
        /// <returns>List of matching artifacts</returns>
        /// <response code="200">Returns the filtered list of artifacts</response>
        [HttpGet("filter/language")]
        [ProducesResponseType(typeof(IEnumerable<ArtifactDto>), 200)]
        public IActionResult FilterByLanguage([FromQuery] string language)
        {
            try
            {
                var artifacts = _unitOfWork.SoftwareDevArtifactRepository.FilterByProgrammingLanguage(language);
                return Ok(artifacts.Select(MapToArtifactDto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while filtering artifacts", error = ex.Message });
            }
        }

        /// <summary>
        /// Filters artifacts by framework
        /// </summary>
        /// <param name="framework">The framework to filter by</param>
        /// <returns>List of matching artifacts</returns>
        /// <response code="200">Returns the filtered list of artifacts</response>
        [HttpGet("filter/framework")]
        [ProducesResponseType(typeof(IEnumerable<ArtifactDto>), 200)]
        public IActionResult FilterByFramework([FromQuery] string framework)
        {
            try
            {
                var artifacts = _unitOfWork.SoftwareDevArtifactRepository.FilterByFramework(framework);
                return Ok(artifacts.Select(MapToArtifactDto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while filtering artifacts", error = ex.Message });
            }
        }

        /// <summary>
        /// Filters artifacts by license type
        /// </summary>
        /// <param name="licenseType">The license type to filter by</param>
        /// <returns>List of matching artifacts</returns>
        /// <response code="200">Returns the filtered list of artifacts</response>
        [HttpGet("filter/license")]
        [ProducesResponseType(typeof(IEnumerable<ArtifactDto>), 200)]
        public IActionResult FilterByLicense([FromQuery] string licenseType)
        {
            try
            {
                var artifacts = _unitOfWork.SoftwareDevArtifactRepository.FilterByLicenseType(licenseType);
                return Ok(artifacts.Select(MapToArtifactDto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while filtering artifacts", error = ex.Message });
            }
        }

        /// <summary>
        /// Advanced search with combined filtering criteria
        /// </summary>
        /// <param name="query">The search and filter criteria</param>
        /// <returns>List of matching artifacts</returns>
        /// <response code="200">Returns the filtered list of artifacts</response>
        [HttpGet("advanced-search")]
        [ProducesResponseType(typeof(IEnumerable<ArtifactDto>), 200)]
        public IActionResult AdvancedSearch([FromQuery] ArtifactSearchQuery query)
        {
            try
            {
                var artifacts = _unitOfWork.SoftwareDevArtifactRepository.FilterByCombinedCriteria(query);
                return Ok(artifacts.Select(MapToArtifactDto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while performing advanced search", error = ex.Message });
            }
        }

        /// <summary>
        /// Moves an artifact to a different category and/or position
        /// </summary>
        /// <param name="id">The ID of the artifact to move</param>
        /// <param name="request">The move request containing the new category ID and optional position</param>
        /// <returns>Updated category tree</returns>
        [HttpPut("{id}/move")]
        public IActionResult MoveArtifact(int id, [FromBody] MoveArtifactRequest request)
        {
            try
            {
                var artifact = _unitOfWork.SoftwareDevArtifactRepository.GetById(id);
                if (artifact == null)
                    return NotFound(new { message = $"Artifact with ID {id} not found" });

                var targetCategory = _unitOfWork.CategoryRepository.GetById(request.NewCategoryId);
                if (targetCategory == null)
                    return NotFound(new { message = $"Target category with ID {request.NewCategoryId} not found" });

                // Get all artifacts in the target category to manage positions
                var categoryArtifacts = _unitOfWork.SoftwareDevArtifactRepository.GetAll()
                    .Where(a => a.CategoryId == request.NewCategoryId)
                    .OrderBy(a => a.Position)
                    .ToList();

                // Store the old category ID for tree refresh
                var oldCategoryId = artifact.CategoryId;
                
                // Update the artifact's category
                artifact.CategoryId = request.NewCategoryId;
                
                // Handle position if specified
                if (request.Position.HasValue)
                {
                    int newPosition = Math.Min(request.Position.Value, categoryArtifacts.Count);
                    newPosition = Math.Max(0, newPosition); // Ensure position is not negative
                    
                    // Update positions of other artifacts in the category
                    foreach (var a in categoryArtifacts)
                    {
                        if (a.Position >= newPosition)
                        {
                            a.Position++;
                        }
                    }
                    
                    artifact.Position = newPosition;
                }
                else
                {
                    // If no position specified, put at the end
                    artifact.Position = categoryArtifacts.Count;
                }

                _unitOfWork.SoftwareDevArtifactRepository.Update(artifact);
                _unitOfWork.Save();

                // Return the updated category tree
                var updatedCategories = _unitOfWork.CategoryRepository.GetAll()
                    .Where(c => c.ParentCategoryId == null)
                    .OrderBy(c => c.Position)
                    .ToList();

                var result = updatedCategories.Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ParentCategoryId = c.ParentCategoryId,
                    Position = c.Position,
                    Path = c.Path,
                    Artifacts = _unitOfWork.SoftwareDevArtifactRepository.GetAll()
                        .Where(a => a.CategoryId == c.Id)
                        .OrderBy(a => a.Position)
                        .Select(MapToArtifactDto)
                        .ToList(),
                    Subcategories = _unitOfWork.CategoryRepository.GetAll()
                        .Where(sc => sc.ParentCategoryId == c.Id)
                        .OrderBy(sc => sc.Position)
                        .Select(sc => new CategoryDto
                        {
                            Id = sc.Id,
                            Name = sc.Name,
                            ParentCategoryId = sc.ParentCategoryId,
                            Position = sc.Position,
                            Path = sc.Path
                        })
                        .ToList()
                }).ToList();

                return Ok(new { 
                    message = "Artifact moved successfully",
                    categories = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while moving the artifact", error = ex.Message });
            }
        }

        private static ArtifactDto MapToArtifactDto(SoftwareDevArtifact artifact)
        {
            return new ArtifactDto
            {
                Id = artifact.Id,
                Title = artifact.Title,
                Description = artifact.Description,
                Url = artifact.Url,
                DocumentationType = artifact.DocumentationType,
                Created = artifact.Created,
                Author = artifact.Author,
                CurrentVersion = artifact.CurrentVersion,
                ProgrammingLanguage = artifact.ProgrammingLanguage,
                Framework = artifact.Framework,
                LicenseType = artifact.LicenseType,
                CategoryId = artifact.CategoryId,
                Versions = artifact.Versions.Select(MapToVersionDto).ToList()
            };
        }

        private static ArtifactVersionDto MapToVersionDto(ArtifactVersion version)
        {
            return new ArtifactVersionDto
            {
                Id = version.Id,
                VersionNumber = version.VersionNumber,
                UpdateDate = version.UpdateDate,
                Changes = version.Changes,
                DownloadUrl = version.DownloadUrl
            };
        }
    }
}
