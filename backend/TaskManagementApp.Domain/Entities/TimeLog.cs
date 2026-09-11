using System;

namespace TaskManagementApp.Domain.Entities;

/// <summary>
/// Tracks time spent by a user on a specific task.
/// </summary>
public class TimeLog
{
    public Guid TimeLogId { get; set; }

    public Guid TaskId { get; set; }

    public Guid UserId { get; set; }

    /// <summary>Hours logged (e.g., 1.5 = 1h30m)</summary>
    public decimal Hours { get; set; }

    public DateTime LogDate { get; set; }

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Task Task { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
