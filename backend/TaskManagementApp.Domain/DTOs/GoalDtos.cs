using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TaskManagementApp.Domain.DTOs;

public class CreateGoalDto
{
    [Required]
    public Guid WorkspaceId { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = null!;
    
    public string? Description { get; set; }
    
    [Required]
    public decimal TargetValue { get; set; }
    
    public string Unit { get; set; } = "percent";
    
    public DateTime? StartDate { get; set; }
    public DateTime? Deadline { get; set; }
}

public class UpdateGoalDto
{
    [MaxLength(255)]
    public string? Title { get; set; }
    public string? Description { get; set; }
    public decimal? TargetValue { get; set; }
    public decimal? CurrentValue { get; set; }
    public string? Unit { get; set; }
    public string? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? Deadline { get; set; }
}

public class CreateKeyResultDto
{
    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = null!;
    
    [Required]
    public decimal TargetValue { get; set; }
}

public class UpdateKeyResultDto
{
    [MaxLength(255)]
    public string? Title { get; set; }
    public decimal? TargetValue { get; set; }
    public decimal? CurrentValue { get; set; }
}
