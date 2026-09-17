using System;

namespace TaskManagementApp.Domain.Entities;

public class SlackInstallation
{
    public Guid SlackInstallationId { get; set; }

    public Guid? WorkspaceId { get; set; }

    public string SlackWorkspaceId { get; set; } = null!;

    public string SlackWorkspaceName { get; set; } = null!;

    public string SlackUserId { get; set; } = null!;

    public string AccessToken { get; set; } = null!;

    public string? Scope { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public virtual Workspace? Workspace { get; set; }
}
