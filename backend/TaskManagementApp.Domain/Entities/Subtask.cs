using System;

namespace TaskManagementApp.Domain.Entities;

public partial class Subtask
{
    public Guid SubtaskId { get; set; }

    public Guid TaskId { get; set; }

    public string Title { get; set; } = null!;

    public bool IsCompleted { get; set; } = false;

    public Guid? AssignedToUserId { get; set; }

    public DateTime? DueDate { get; set; }

    public int SortOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; }

    public virtual Task Task { get; set; } = null!;

    public virtual User? AssignedToUser { get; set; }
}
