using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Task = System.Threading.Tasks.Task; // resolve ambiguity with Domain.Entities.Task
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Domain.Entities;
using TaskManagementApp.Infrastructure.Data;

namespace TaskManagementApp.Controllers;

[ApiController]
[Route("api/workspaces/{workspaceId:guid}/webhooks")]
[Authorize]
public class WebhooksController : ControllerBase
{
    private readonly TaskManagementAppContext _db;
    private readonly IHttpClientFactory _httpClientFactory;

    public WebhooksController(TaskManagementAppContext db, IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> IsAdminAsync(Guid workspaceId, Guid userId)
    {
        return await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId && wm.Role == "Admin")
               || await _db.Workspaces.AnyAsync(w => w.WorkspaceId == workspaceId && w.OwnerId == userId);
    }

    private async Task<bool> IsMemberAsync(Guid workspaceId, Guid userId)
    {
        return await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId)
               || await _db.Workspaces.AnyAsync(w => w.WorkspaceId == workspaceId && w.OwnerId == userId);
    }

    public record WebhookCreateDto(string Url, string? Secret = null, string? Events = null);
    public record WebhookUpdateDto(string? Url = null, string? Secret = null, string? Events = null, bool? IsActive = null);

    [HttpGet]
    public async Task<IActionResult> GetWebhooks(Guid workspaceId)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(workspaceId, userId)) return Forbid();

        var webhooks = await _db.WebhookEndpoints
            .AsNoTracking()
            .Where(we => we.WorkspaceId == workspaceId)
            .Select(we => new {
                we.WebhookEndpointId,
                we.Url,
                we.Events,
                we.IsActive,
                we.CreatedAt,
                DeliveredCount = we.WebhookEvents.Count(wne => wne.Delivered),
                FailedCount = we.WebhookEvents.Count(wne => !wne.Delivered)
            })
            .ToListAsync();

        return Ok(webhooks);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetWebhook(Guid workspaceId, Guid id)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(workspaceId, userId)) return Forbid();

        var webhook = await _db.WebhookEndpoints.AsNoTracking()
            .FirstOrDefaultAsync(we => we.WebhookEndpointId == id && we.WorkspaceId == workspaceId);
        if (webhook == null) return NotFound();

        return Ok(new { webhook.WebhookEndpointId, webhook.Url, webhook.Events, webhook.IsActive, webhook.CreatedAt });
    }

    [HttpPost]
    public async Task<IActionResult> CreateWebhook(Guid workspaceId, [FromBody] WebhookCreateDto dto)
    {
        var userId = GetUserId();
        if (!await IsAdminAsync(workspaceId, userId)) return Forbid();

        var webhook = new WebhookEndpoint
        {
            WebhookEndpointId = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            Url = dto.Url,
            Secret = dto.Secret,
            Events = dto.Events,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.WebhookEndpoints.Add(webhook);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetWebhook), new { id = webhook.WebhookEndpointId, workspaceId }, webhook);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateWebhook(Guid workspaceId, Guid id, [FromBody] WebhookUpdateDto dto)
    {
        var userId = GetUserId();
        if (!await IsAdminAsync(workspaceId, userId)) return Forbid();

        var webhook = await _db.WebhookEndpoints.FirstOrDefaultAsync(we => we.WebhookEndpointId == id && we.WorkspaceId == workspaceId);
        if (webhook == null) return NotFound();

        if (dto.Url is not null) webhook.Url = dto.Url;
        if (dto.Secret is not null) webhook.Secret = dto.Secret;
        if (dto.Events is not null) webhook.Events = dto.Events;
        if (dto.IsActive.HasValue) webhook.IsActive = dto.IsActive.Value;

        await _db.SaveChangesAsync();
        return Ok(webhook);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteWebhook(Guid workspaceId, Guid id)
    {
        var userId = GetUserId();
        if (!await IsAdminAsync(workspaceId, userId)) return Forbid();

        var webhook = await _db.WebhookEndpoints.FirstOrDefaultAsync(we => we.WebhookEndpointId == id && we.WorkspaceId == workspaceId);
        if (webhook == null) return NotFound();

        _db.WebhookEndpoints.Remove(webhook);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("test")]
    public async Task<IActionResult> TestWebhook(Guid workspaceId, [FromBody] WebhookCreateDto dto)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(workspaceId, userId)) return Forbid();

        var client = _httpClientFactory.CreateClient();
        var payload = new { test = true, timestamp = DateTime.UtcNow, message = "Webhook test from DoneIt" };
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        if (!string.IsNullOrEmpty(dto.Secret))
        {
            var signature = Convert.ToBase64String(new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(dto.Secret)).ComputeHash(Encoding.UTF8.GetBytes(json)));
            content.Headers.TryAddWithoutValidation("X-DoneIt-Signature", signature);
        }

        try
        {
            var response = await client.PostAsync(dto.Url, content);
            return Ok(new { success = response.IsSuccessStatusCode, statusCode = (int)response.StatusCode, response = await response.Content.ReadAsStringAsync() });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    public static async Task DispatchEventAsync(IServiceProvider services, Guid workspaceId, string eventType, object payload)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TaskManagementAppContext>();
        var httpClientFactory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();

        var webhooks = await db.WebhookEndpoints
            .AsNoTracking()
            .Where(we => we.WorkspaceId == workspaceId && we.IsActive)
            .ToListAsync();

        if (webhooks.Count == 0) return;

        var json = JsonSerializer.Serialize(payload);
        var tasks = webhooks.Select(async webhook =>
        {
            var client = httpClientFactory.CreateClient();
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            if (!string.IsNullOrEmpty(webhook.Secret))
            {
                var signature = Convert.ToBase64String(new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(webhook.Secret)).ComputeHash(Encoding.UTF8.GetBytes(json)));
                content.Headers.TryAddWithoutValidation("X-DoneIt-Signature", signature);
            }

            try
            {
                var response = await client.PostAsync(webhook.Url, content);
                var delivered = response.IsSuccessStatusCode;

                var eventRecord = new WebhookEvent
                {
                    WebhookEventId = Guid.NewGuid(),
                    WebhookEndpointId = webhook.WebhookEndpointId,
                    EventType = eventType,
                    Payload = json,
                    Delivered = delivered,
                    DeliveryAttempts = 1,
                    CreatedAt = DateTime.UtcNow,
                    DeliveredAt = delivered ? DateTime.UtcNow : null
                };
                db.WebhookEvents.Add(eventRecord);
                await db.SaveChangesAsync();
            }
            catch
            {
                var eventRecord = new WebhookEvent
                {
                    WebhookEventId = Guid.NewGuid(),
                    WebhookEndpointId = webhook.WebhookEndpointId,
                    EventType = eventType,
                    Payload = json,
                    Delivered = false,
                    DeliveryAttempts = 1,
                    CreatedAt = DateTime.UtcNow
                };
                db.WebhookEvents.Add(eventRecord);
                await db.SaveChangesAsync();
            }
        });

        await Task.WhenAll(tasks);
    }

    public static async Task DispatchFromControllerAsync(ControllerBase controller, IHttpClientFactory httpClientFactory, Guid workspaceId, string eventType, object payload)
    {
        var db = controller.HttpContext.RequestServices.GetRequiredService<TaskManagementAppContext>();

        var webhooks = await db.WebhookEndpoints
            .AsNoTracking()
            .Where(we => we.WorkspaceId == workspaceId && we.IsActive)
            .ToListAsync();

        if (webhooks.Count == 0) return;

        var json = JsonSerializer.Serialize(payload);
        var tasks = webhooks.Select(async webhook =>
        {
            var client = httpClientFactory.CreateClient();
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            if (!string.IsNullOrEmpty(webhook.Secret))
            {
                var signature = Convert.ToBase64String(new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(webhook.Secret)).ComputeHash(Encoding.UTF8.GetBytes(json)));
                content.Headers.TryAddWithoutValidation("X-DoneIt-Signature", signature);
            }

            try
            {
                await client.PostAsync(webhook.Url, content);
                var eventRecord = new WebhookEvent
                {
                    WebhookEventId = Guid.NewGuid(),
                    WebhookEndpointId = webhook.WebhookEndpointId,
                    EventType = eventType,
                    Payload = json,
                    Delivered = true,
                    DeliveryAttempts = 1,
                    CreatedAt = DateTime.UtcNow,
                    DeliveredAt = DateTime.UtcNow
                };
                db.WebhookEvents.Add(eventRecord);
                await db.SaveChangesAsync();
            }
            catch
            {
                var eventRecord = new WebhookEvent
                {
                    WebhookEventId = Guid.NewGuid(),
                    WebhookEndpointId = webhook.WebhookEndpointId,
                    EventType = eventType,
                    Payload = json,
                    Delivered = false,
                    DeliveryAttempts = 1,
                    CreatedAt = DateTime.UtcNow
                };
                db.WebhookEvents.Add(eventRecord);
                await db.SaveChangesAsync();
            }
        });

        await Task.WhenAll(tasks);
    }
}
