using System;
using System.Collections.Generic;

namespace TaskManagementApp.Domain.Entities;

public class Tag
{
    public Guid TagId { get; set; }

    public Guid WorkspaceId { get; set; }

    public string Name { get; set; } = null!;

    public string Color { get; set; } = "#6B7280";

    public DateTime CreatedAt { get; set; }

    public virtual Workspace Workspace { get; set; } = null!;

    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
}
