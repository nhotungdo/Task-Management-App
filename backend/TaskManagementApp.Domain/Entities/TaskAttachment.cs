using System;

namespace TaskManagementApp.Domain.Entities;

/// <summary>
/// File attachment uploaded to a task.
/// </summary>
public class TaskAttachment
{
    public Guid TaskAttachmentId { get; set; }

    public Guid TaskId { get; set; }

    public Guid UserId { get; set; }

    public string FileName { get; set; } = null!;

    /// <summary>URL or relative path to the stored file</summary>
    public string FileUrl { get; set; } = null!;

    public string? ContentType { get; set; }

    public long FileSizeBytes { get; set; }

    public DateTime UploadedAt { get; set; }

    public virtual Task Task { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
