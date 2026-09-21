using System;
using System.Collections.Generic;

namespace TaskManagementApp.Domain.Entities;

public class Goal
{
    public Guid GoalId { get; set; }
    public Guid WorkspaceId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal TargetValue { get; set; }
    public decimal CurrentValue { get; set; }
    public string Unit { get; set; } = "percent";
    public DateTime? StartDate { get; set; }
    public DateTime? Deadline { get; set; }
    public string Status { get; set; } = "On Track"; // On Track, At Risk, Off Track, Achieved
    public Guid OwnerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Workspace? Workspace { get; set; }
    public User? Owner { get; set; }
    public ICollection<KeyResult> KeyResults { get; set; } = new List<KeyResult>();
}
