using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ERMSystem.Application.DTOs;

namespace ERMSystem.Application.Interfaces
{
    public interface IUserService
    {
        Task<IReadOnlyList<UserDto>> GetAllUsersAsync();
        Task<UserDto?> GetUserByIdAsync(Guid id);
        Task<UserDto> CreateUserAsync(CreateUserDto dto);
        Task<UserDto> UpdateUserAsync(UpdateUserDto dto);
        Task DeleteUserAsync(Guid id);
        Task LockUserAsync(Guid id);
        Task UnlockUserAsync(Guid id);
        Task<UserDto> ChangeRoleAsync(ChangeRoleDto dto);
    }
}
