using System;
using System.Collections.Generic;

namespace TaskManagementApp.Domain.Entities;

public class CustomField
{
    public Guid CustomFieldId { get; set; }

    public Guid WorkspaceId { get; set; }

    public string Name { get; set; } = null!;

    public string FieldType { get; set; } = "Text";

    public string? OptionsJson { get; set; }

    public bool IsRequired { get; set; } = false;

    public int SortOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; }

    public virtual Workspace Workspace { get; set; } = null!;

    public virtual ICollection<TaskCustomFieldValue> Values { get; set; } = new List<TaskCustomFieldValue>();
}

public class TaskCustomFieldValue
{
    public Guid TaskCustomFieldValueId { get; set; }

    public Guid TaskId { get; set; }

    public Guid CustomFieldId { get; set; }

    public string? ValueText { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Task Task { get; set; } = null!;

    public virtual CustomField CustomField { get; set; } = null!;
}
