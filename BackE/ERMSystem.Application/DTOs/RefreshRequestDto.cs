using System.ComponentModel.DataAnnotations;

namespace ERMSystem.Application.DTOs
{
    public class RefreshRequestDto
    {
        [Required]
        public string AccessToken { get; set; } = string.Empty;

        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
