using System;
using System.Collections.Generic;

namespace TaskManagementApp.Domain.Entities;

public partial class Workspace
{
    public Guid WorkspaceId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public Guid OwnerId { get; set; }
    public DateTime CreatedAt { get; set; }

    public virtual User Owner { get; set; } = null!;
    public virtual ICollection<WorkspaceMember> WorkspaceMembers { get; set; } = new List<WorkspaceMember>();
    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
    public virtual ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
}
