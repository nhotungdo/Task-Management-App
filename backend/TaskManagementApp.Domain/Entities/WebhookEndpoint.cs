using System;
using System.Collections.Generic;

namespace TaskManagementApp.Domain.Entities;

public class WebhookEndpoint
{
    public Guid WebhookEndpointId { get; set; }

    public Guid WorkspaceId { get; set; }

    public string Url { get; set; } = null!;

    public string? Secret { get; set; }

    public string? Events { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public virtual Workspace Workspace { get; set; } = null!;

    public virtual ICollection<WebhookEvent> WebhookEvents { get; set; } = new List<WebhookEvent>();
}

public class WebhookEvent
{
    public Guid WebhookEventId { get; set; }

    public Guid WebhookEndpointId { get; set; }

    public string EventType { get; set; } = null!;

    public string Payload { get; set; } = null!;

    public bool Delivered { get; set; } = false;

    public int DeliveryAttempts { get; set; } = 0;

    public DateTime CreatedAt { get; set; }

    public DateTime? DeliveredAt { get; set; }

    public virtual WebhookEndpoint WebhookEndpoint { get; set; } = null!;
}
