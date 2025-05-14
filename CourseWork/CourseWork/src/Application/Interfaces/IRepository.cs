using System.Collections.Generic;

namespace CourseWork.Application.Interfaces
{
    /// <summary>
    /// Generic repository interface defining basic CRUD operations.
    /// </summary>
    public interface IRepository<T> where T : class
    {
        IEnumerable<T> GetAll();
        T GetById(int id);
        void Add(T entity);
        void Update(T entity);
        void Delete(int id);
        IEnumerable<T> FindByExample(T example);
    }
}
