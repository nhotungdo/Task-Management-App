using System;

namespace TaskManagementApp.Domain.Entities;

public class TaskAuditLog
{
    public Guid TaskAuditLogId { get; set; } = Guid.NewGuid();
    public Guid TaskId { get; set; }
    public Guid? UserId { get; set; }
    
    /// <summary>
    /// E.g., "StatusChanged", "AssignedTo", "TitleChanged", "Created", "Deleted"
    /// </summary>
    public string Action { get; set; } = null!;
    
    public string? FieldName { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Task Task { get; set; } = null!;
    public virtual User? User { get; set; }
}
