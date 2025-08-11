using System;
using System.Collections.Generic;

namespace TaskManagementApp.Models;

public partial class TaskAssignment
{
    public Guid TaskAssignmentId { get; set; }

    public Guid TaskId { get; set; }

    public Guid UserId { get; set; }

    public DateTime AssignedAt { get; set; }

    public virtual Task Task { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
