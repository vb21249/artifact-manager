using System;

namespace CourseWork.Application.Interfaces
{
    /// <summary>
    /// Interface for the Unit of Work pattern implementation.
    /// </summary>
    public interface IUnitOfWork : IDisposable
    {
        ICategoryRepository CategoryRepository { get; }
        ISoftwareDevArtifactRepository SoftwareDevArtifactRepository { get; }
        void Save();
    }
}
