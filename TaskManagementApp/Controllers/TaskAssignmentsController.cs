using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Models;

namespace TaskManagementApp.Controllers;

[ApiController]
[Route("api/tasks/{taskId:guid}/assignments")]
[Authorize]
public class TaskAssignmentsController : ControllerBase
{
    private readonly TaskManagementAppContext _db;
    private readonly IHubContext<RealTime.TaskHub> _taskHub;

    public TaskAssignmentsController(TaskManagementAppContext db, IHubContext<RealTime.TaskHub> taskHub)
    {
        _db = db;
        _taskHub = taskHub;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    public record AssignDto(Guid UserId);

    [HttpPost]
    public async Task<IActionResult> Assign(Guid taskId, [FromBody] AssignDto dto)
    {
        var ownerId = GetUserId();
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == taskId && t.OwnerId == ownerId);
        if (task == null) return NotFound();
        var user = await _db.Users.FindAsync(dto.UserId);
        if (user == null) return BadRequest("User not found");

        var exists = await _db.TaskAssignments.AnyAsync(a => a.TaskId == taskId && a.UserId == dto.UserId);
        if (exists) return Conflict("Already assigned");

        var assignment = new TaskAssignment
        {
            TaskAssignmentId = Guid.NewGuid(),
            TaskId = taskId,
            UserId = dto.UserId,
            AssignedAt = DateTime.UtcNow
        };
        _db.TaskAssignments.Add(assignment);
        await _db.SaveChangesAsync();
        await _taskHub.Clients.User(ownerId.ToString()).SendAsync("TaskAssigned", new { taskId, userId = dto.UserId });
        await _taskHub.Clients.User(dto.UserId.ToString()).SendAsync("TaskAssigned", new { taskId, userId = dto.UserId });
        return Ok(assignment);
    }

    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> Unassign(Guid taskId, Guid userId)
    {
        var ownerId = GetUserId();
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == taskId && t.OwnerId == ownerId);
        if (task == null) return NotFound();
        var assignment = await _db.TaskAssignments.FirstOrDefaultAsync(a => a.TaskId == taskId && a.UserId == userId);
        if (assignment == null) return NotFound();
        _db.TaskAssignments.Remove(assignment);
        await _db.SaveChangesAsync();
        await _taskHub.Clients.User(ownerId.ToString()).SendAsync("TaskUnassigned", new { taskId, userId });
        await _taskHub.Clients.User(userId.ToString()).SendAsync("TaskUnassigned", new { taskId, userId });
        return NoContent();
    }
}


