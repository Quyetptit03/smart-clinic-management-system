using System.ComponentModel.DataAnnotations;

namespace ERMSystem.Application.DTOs
{
    public class RevokeTokenDto
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
