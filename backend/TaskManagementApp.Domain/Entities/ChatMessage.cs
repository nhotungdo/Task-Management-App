using System;

namespace TaskManagementApp.Domain.Entities;

public partial class ChatMessage
{
    public Guid MessageId { get; set; }
    public Guid? WorkspaceId { get; set; }
    public Guid? ReceiverId { get; set; }
    public Guid SenderId { get; set; }
    public string Content { get; set; } = null!;
    public DateTime SentAt { get; set; }

    public virtual Workspace? Workspace { get; set; }
    public virtual User Sender { get; set; } = null!;
    public virtual User? Receiver { get; set; }
}
