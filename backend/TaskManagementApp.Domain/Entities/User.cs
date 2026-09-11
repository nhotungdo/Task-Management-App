using System;
using System.Collections.Generic;

namespace TaskManagementApp.Domain.Entities;

public partial class User
{
    public Guid UserId { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string? FullName { get; set; }

    public string Role { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual ICollection<TaskAssignment> TaskAssignments { get; set; } = new List<TaskAssignment>();

    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();

    public virtual ICollection<Workspace> Workspaces { get; set; } = new List<Workspace>();
    public virtual ICollection<WorkspaceMember> WorkspaceMembers { get; set; } = new List<WorkspaceMember>();
    public virtual ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
    public virtual ICollection<ChatMessage> ReceivedMessages { get; set; } = new List<ChatMessage>();
    public virtual ICollection<TimeLog> TimeLogs { get; set; } = new List<TimeLog>();
    public virtual ICollection<TaskComment> TaskComments { get; set; } = new List<TaskComment>();
    public virtual ICollection<TaskAttachment> TaskAttachments { get; set; } = new List<TaskAttachment>();
}
