using System;
using System.Collections.Generic;

namespace TaskManagementApp.Models;

public partial class ActivityLog
{
    public Guid LogId { get; set; }

    public Guid UserId { get; set; }

    public string Action { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
