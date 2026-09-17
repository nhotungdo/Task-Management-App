using System;
using System.Collections.Generic;

namespace TaskManagementApp.Domain.Entities;

public class ProjectTemplate
{
    public Guid ProjectTemplateId { get; set; }

    public Guid WorkspaceId { get; set; }

    public Guid CreatedByUserId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Workspace Workspace { get; set; } = null!;

    public virtual User CreatedByUser { get; set; } = null!;

    public virtual ICollection<TemplateTask> TemplateTasks { get; set; } = new List<TemplateTask>();
}

public class TemplateTask
{
    public Guid TemplateTaskId { get; set; }

    public Guid ProjectTemplateId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string Priority { get; set; } = "Normal";

    public string Status { get; set; } = "To Do";

    public int SortOrder { get; set; } = 0;

    public virtual ProjectTemplate ProjectTemplate { get; set; } = null!;
}
