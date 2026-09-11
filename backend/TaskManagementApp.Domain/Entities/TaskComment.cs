using System;

namespace TaskManagementApp.Domain.Entities;

/// <summary>
/// A comment posted on a task by a workspace member.
/// </summary>
public class TaskComment
{
    public Guid TaskCommentId { get; set; }

    public Guid TaskId { get; set; }

    public Guid UserId { get; set; }

    public string Content { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Task Task { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
