using System;

namespace TaskManagementApp.Domain.Entities;

public class TaskApproval
{
    public Guid TaskApprovalId { get; set; }
    public Guid TaskId { get; set; }
    public Guid ApproverId { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
    public string? Comments { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }

    public virtual Task? Task { get; set; }
    public virtual User? Approver { get; set; }
}
