using System;

namespace TaskManagementApp.Domain.Entities;

public partial class WorkspaceMember
{
    public Guid WorkspaceMemberId { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = null!; // "Admin" or "Member"
    public DateTime JoinedAt { get; set; }

    public virtual Workspace Workspace { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
