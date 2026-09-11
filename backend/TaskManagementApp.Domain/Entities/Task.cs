using System;
using System.Collections.Generic;

namespace TaskManagementApp.Domain.Entities;

public partial class Task
{
    public Guid TaskId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? DueDate { get; set; }

    public string Priority { get; set; } = null!;

    public string Status { get; set; } = null!;

    /// <summary>Progress percentage 0-100</summary>
    public int Progress { get; set; } = 0;

    public decimal? EstimatedHours { get; set; }

    public decimal? ActualHours { get; set; }

    public bool IsMilestone { get; set; } = false;

    public Guid OwnerId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? WorkspaceId { get; set; }

    public virtual User Owner { get; set; } = null!;

    public virtual Workspace? Workspace { get; set; }

    public virtual ICollection<TaskAssignment> TaskAssignments { get; set; } = new List<TaskAssignment>();

    public virtual ICollection<TaskDependency> Predecessors { get; set; } = new List<TaskDependency>();

    public virtual ICollection<TaskDependency> Successors { get; set; } = new List<TaskDependency>();

    public virtual ICollection<TimeLog> TimeLogs { get; set; } = new List<TimeLog>();

    public virtual ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();

    public virtual ICollection<TaskAttachment> Attachments { get; set; } = new List<TaskAttachment>();
}
