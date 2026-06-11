using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ERMSystem.Application.DTOs;
using ERMSystem.Application.Interfaces;
using ERMSystem.Domain.Entities;

namespace ERMSystem.Infrastructure.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<IReadOnlyList<UserDto>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllAsync();
            return users.Select(MapToDto).ToList();
        }

        public async Task<UserDto?> GetUserByIdAsync(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            return user == null ? null : MapToDto(user);
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDto dto)
        {
            var username = dto.Username.Trim().ToLowerInvariant();

            if (await _userRepository.UsernameExistsAsync(username))
                throw new InvalidOperationException($"Username '{username}' is already taken.");

            if (!Array.Exists(AppRole.All, r => r == dto.Role))
                throw new ArgumentException($"Invalid role '{dto.Role}'. Must be Admin, Doctor, or Receptionist.");

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Username = username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = dto.Role
            };

            await _userRepository.AddAsync(user);
            return MapToDto(user);
        }

        public async Task<UserDto> UpdateUserAsync(UpdateUserDto dto)
        {
            var user = await _userRepository.GetByIdAsync(dto.Id)
                ?? throw new KeyNotFoundException($"User with ID '{dto.Id}' was not found.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            await _userRepository.UpdateAsync(user);
            return MapToDto(user);
        }

        public async Task DeleteUserAsync(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                throw new KeyNotFoundException($"User with ID '{id}' was not found.");

            await _userRepository.DeleteAsync(id);
        }

        public async Task LockUserAsync(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                throw new KeyNotFoundException($"User with ID '{id}' was not found.");

            if (user.IsLocked)
                throw new InvalidOperationException($"User '{user.Username}' is already locked.");

            await _userRepository.LockAsync(id);
        }

        public async Task UnlockUserAsync(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                throw new KeyNotFoundException($"User with ID '{id}' was not found.");

            if (!user.IsLocked)
                throw new InvalidOperationException($"User '{user.Username}' is not locked.");

            await _userRepository.UnlockAsync(id);
        }

        public async Task<UserDto> ChangeRoleAsync(ChangeRoleDto dto)
        {
            var user = await _userRepository.GetByIdAsync(dto.UserId)
                ?? throw new KeyNotFoundException($"User with ID '{dto.UserId}' was not found.");

            if (!Array.Exists(AppRole.All, r => r == dto.NewRole))
                throw new ArgumentException($"Invalid role '{dto.NewRole}'. Must be Admin, Doctor, or Receptionist.");

            user.Role = dto.NewRole;
            await _userRepository.UpdateAsync(user);
            return MapToDto(user);
        }

        private static UserDto MapToDto(AppUser user) => new()
        {
            Id = user.Id,
            Username = user.Username,
            Role = user.Role,
            IsLocked = user.IsLocked,
            LockedAt = user.LockedAt,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }
}
