using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Models;

namespace TaskManagementApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly TaskManagementAppContext _db;
    private readonly IHubContext<RealTime.TaskHub> _taskHub;

    public TasksController(TaskManagementAppContext db, IHubContext<RealTime.TaskHub> taskHub)
    {
        _db = db;
        _taskHub = taskHub;
    }

    public record TaskCreateDto(string Title, string? Description, DateTime? DueDate, string Priority, string Status);
    public record TaskUpdateDto(string? Title, string? Description, DateTime? DueDate, string? Priority, string? Status);

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? status, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = GetUserId();
        var query = _db.Tasks.AsNoTracking().Where(t => t.OwnerId == userId);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(t => t.Status == status);
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(t => t.Title.Contains(search) || (t.Description ?? "").Contains(search));
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = GetUserId();
        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskId == id && t.OwnerId == userId);
        if (task == null) return NotFound();
        return Ok(task);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TaskCreateDto dto)
    {
        var userId = GetUserId();
        var task = new Models.Task
        {
            TaskId = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            DueDate = dto.DueDate,
            Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Normal" : dto.Priority,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "To Do" : dto.Status,
            OwnerId = userId,
            CreatedAt = DateTime.UtcNow
        };
        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();
        await _taskHub.Clients.User(userId.ToString()).SendAsync("TaskCreated", task);
        return CreatedAtAction(nameof(GetById), new { id = task.TaskId }, task);
    }

    [HttpPut("{id:guid}")]
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] TaskUpdateDto dto)
    {
        var userId = GetUserId();
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == id && t.OwnerId == userId);
        if (task == null) return NotFound();
        if (dto.Title is not null) task.Title = dto.Title;
        if (dto.Description is not null) task.Description = dto.Description;
        if (dto.DueDate.HasValue) task.DueDate = dto.DueDate.Value;
        if (!string.IsNullOrWhiteSpace(dto.Priority)) task.Priority = dto.Priority!;
        if (!string.IsNullOrWhiteSpace(dto.Status)) task.Status = dto.Status!;
        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _taskHub.Clients.User(userId.ToString()).SendAsync("TaskUpdated", task);
        return Ok(task);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == id && t.OwnerId == userId);
        if (task == null) return NotFound();
        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();
        await _taskHub.Clients.User(userId.ToString()).SendAsync("TaskDeleted", new { TaskId = id });
        return NoContent();
    }
}


