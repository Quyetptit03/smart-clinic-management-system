using System;
using System.ComponentModel.DataAnnotations;

namespace ERMSystem.Application.DTOs
{
    public class ChangeRoleDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        [RegularExpression("^(Admin|Doctor|Receptionist)$",
            ErrorMessage = "Role must be Admin, Doctor, or Receptionist.")]
        public string NewRole { get; set; } = string.Empty;
    }
}
