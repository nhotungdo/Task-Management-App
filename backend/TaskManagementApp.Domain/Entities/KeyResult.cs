using System;

namespace TaskManagementApp.Domain.Entities;

public class KeyResult
{
    public Guid KeyResultId { get; set; }
    public Guid GoalId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal TargetValue { get; set; }
    public decimal CurrentValue { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Goal? Goal { get; set; }
}
