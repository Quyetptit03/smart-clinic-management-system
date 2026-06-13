using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ERMSystem.Domain.Entities;

namespace ERMSystem.Application.Interfaces
{
    public interface IUserRepository
    {
        Task<IReadOnlyList<AppUser>> GetAllAsync();
        Task<AppUser?> GetByIdAsync(Guid id);
        Task<AppUser?> GetByUsernameAsync(string username);
        Task<bool> UsernameExistsAsync(string username);
        Task AddAsync(AppUser user);
        Task UpdateAsync(AppUser user);
        Task DeleteAsync(Guid id);
        Task LockAsync(Guid id);
        Task UnlockAsync(Guid id);
        Task<RefreshToken?> GetRefreshTokenAsync(string token);
        Task AddRefreshTokenAsync(RefreshToken token);
        Task UpdateRefreshTokenAsync(RefreshToken token);
        Task RevokeAllUserTokensAsync(Guid userId);
    }
}
