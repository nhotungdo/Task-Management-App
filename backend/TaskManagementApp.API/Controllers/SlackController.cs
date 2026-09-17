using System.Text.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Domain.Entities;
using TaskManagementApp.Infrastructure.Data;

namespace TaskManagementApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SlackController : ControllerBase
{
    private readonly TaskManagementAppContext _db;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;

    public SlackController(TaskManagementAppContext db, IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("install")]
    [AllowAnonymous]
    public IActionResult Install()
    {
        var clientId = _config["Slack:ClientId"];
        if (string.IsNullOrEmpty(clientId)) return BadRequest("Slack not configured");
        var redirectUri = _config["Slack:RedirectUri"] ?? "https://localhost:7070/api/slack/oauth";
        var scopes = "chat:write,commands,users:read,channels:read";
        var url = $"https://slack.com/oauth/v2/authorize?client_id={clientId}&scope={scopes}&redirect_uri={redirectUri}&user_scope=channels:read";
        return Ok(new { url });
    }

    [HttpGet("oauth")]
    [AllowAnonymous]
    public async Task<IActionResult> OAuth(string code)
    {
        var clientId = _config["Slack:ClientId"];
        var clientSecret = _config["Slack:ClientSecret"];
        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            return BadRequest("Slack not configured");

        var redirectUri = _config["Slack:RedirectUri"] ?? "https://localhost:7070/api/slack/oauth";

        using var client = _httpClientFactory.CreateClient();
        var response = await client.GetAsync(
            $"https://slack.com/api/oauth.v2.access?client_id={clientId}&client_secret={clientSecret}&code={code}&redirect_uri={redirectUri}");
        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(json);

        if (!result.GetProperty("ok").GetBoolean())
            return BadRequest(new { error = result.TryGetProperty("error", out var err) ? err.GetString() : "Unknown error" });

        var accessToken = result.GetProperty("authed_user").GetProperty("access_token").GetString();
        var slackWorkspaceId = result.GetProperty("team").GetProperty("id").GetString();
        var slackWorkspaceName = result.GetProperty("team").GetProperty("name").GetString();

        var installation = new SlackInstallation
        {
            SlackInstallationId = Guid.NewGuid(),
            SlackWorkspaceId = slackWorkspaceId!,
            SlackWorkspaceName = slackWorkspaceName!,
            SlackUserId = result.GetProperty("authed_user").GetProperty("id").GetString()!,
            AccessToken = accessToken!,
            Scope = result.TryGetProperty("scope", out var scopeProp) ? scopeProp.GetString() : null,
            CreatedAt = DateTime.UtcNow
        };
        _db.SlackInstallations.Add(installation);
        await _db.SaveChangesAsync();

        return Ok(new { success = true, workspace = slackWorkspaceId });
    }

    [HttpPost("command")]
    [AllowAnonymous]
    public async Task<IActionResult> Command()
    {
        var verificationToken = _config["Slack:VerificationToken"];
        var token = Request.Form["token"];
        if (!string.IsNullOrEmpty(verificationToken) && token != verificationToken)
            return Unauthorized();

        var command = Request.Form["command"].ToString();
        var text = Request.Form["text"].ToString();
        var userName = Request.Form["user_name"].ToString();

        if (command != "/doneit" && command != "/task")
            return Ok(new { text = "Lệnh không được hỗ trợ. Sử dụng `/doneit create <task> [workspace]`" });

        var parts = (text ?? "").Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var action = parts.Length > 0 ? parts[0].ToLowerInvariant() : "";
        var rest = parts.Length > 1 ? parts[1] : "";

        if (action == "create" || action == "add")
        {
            if (string.IsNullOrWhiteSpace(rest))
                return Ok(new { response_type = "ephemeral", text = "Vui lòng cung cấp tiêu đề: `/doneit create <tiêu đề công việc>`" });

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == userName || u.FullName == userName);
            Guid? workspaceId = null;

            if (parts.Length > 2 && Guid.TryParse(parts[2], out var parsedWs))
                workspaceId = parsedWs;

            if (!workspaceId.HasValue)
            {
                var anyWorkspace = await _db.Workspaces.OrderByDescending(w => w.CreatedAt).FirstOrDefaultAsync();
                if (anyWorkspace == null)
                    return Ok(new { response_type = "ephemeral", text = "Không tìm thấy workspace nào." });
                workspaceId = anyWorkspace.WorkspaceId;
            }

            if (user != null)
            {
                var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == user.UserId);
                if (!isMember)
                {
                    var newMember = new WorkspaceMember
                    {
                        WorkspaceMemberId = Guid.NewGuid(),
                        WorkspaceId = workspaceId.Value,
                        UserId = user.UserId,
                        Role = "Member",
                        JoinedAt = DateTime.UtcNow
                    };
                    _db.WorkspaceMembers.Add(newMember);
                }
            }

            var task = new TaskManagementApp.Domain.Entities.Task
            {
                TaskId = Guid.NewGuid(),
                Title = rest,
                Status = "To Do",
                Priority = "Normal",
                OwnerId = user?.UserId ?? Guid.Empty,
                WorkspaceId = workspaceId,
                CreatedAt = DateTime.UtcNow
            };
            _db.Tasks.Add(task);
            await _db.SaveChangesAsync();

            var workspaceName = await _db.Workspaces.Where(w => w.WorkspaceId == workspaceId).Select(w => w.Name).FirstOrDefaultAsync() ?? "Unknown";

            return Ok(new
            {
                response_type = "ephemeral",
                text = $"✅ Đã tạo công việc *{rest}* trong dự án *{workspaceName}*",
                attachments = new[] { new { text = $"Task ID: {task.TaskId}", color = "#4361ee" } }
            });
        }

        if (action == "list" || action == "tasks")
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == userName || u.FullName == userName);
            if (user == null)
                return Ok(new { response_type = "ephemeral", text = "Không tìm thấy tài khoản người dùng của bạn." });

            var tasks = await _db.Tasks
                .AsNoTracking()
                .Where(t => t.OwnerId == user.UserId && t.Status != "Done")
                .OrderBy(t => t.DueDate)
                .Take(10)
                .Select(t => $"• <*{t.Title}*> ({t.Status})")
                .ToListAsync();

            if (tasks.Count == 0)
                return Ok(new { response_type = "ephemeral", text = "Bạn không có công việc nào đang mở." });

            return Ok(new { response_type = "ephemeral", text = "Công việc đang mở:", attachments = tasks.Select(t => new { text = t, color = "#4361ee" }) });
        }

        return Ok(new { response_type = "ephemeral", text = "Lệnh không xác định. Các lệnh hỗ trợ: `create`, `list`" });
    }
}
