using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using TaskManagementApp.Domain.Entities;
using TaskManagementApp.Domain.DTOs;
using TaskManagementApp.Infrastructure.Data;
using System.Security.Claims;

namespace TaskManagementApp.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GoalsController : ControllerBase
{
    private readonly TaskManagementAppContext _context;

    public GoalsController(TaskManagementAppContext context)
    {
        _context = context;
    }

    private Guid GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return idClaim != null ? Guid.Parse(idClaim) : Guid.Empty;
    }

    [HttpGet]
    public async Task<IActionResult> GetGoals([FromQuery] Guid workspaceId)
    {
        var userId = GetCurrentUserId();

        // Check if user is a member of the workspace
        var isMember = await _context.WorkspaceMembers
            .AnyAsync(m => m.WorkspaceId == workspaceId && m.UserId == userId);

        if (!isMember)
        {
            return Forbid();
        }

        var goals = await _context.Goals
            .Include(g => g.Owner)
            .Include(g => g.KeyResults)
            .Where(g => g.WorkspaceId == workspaceId)
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new
            {
                g.GoalId,
                g.Title,
                g.Description,
                g.TargetValue,
                g.CurrentValue,
                g.Unit,
                g.Status,
                g.StartDate,
                g.Deadline,
                g.OwnerId,
                OwnerName = g.Owner != null ? (g.Owner.FullName ?? g.Owner.Email) : null,
                g.CreatedAt,
                KeyResults = g.KeyResults.Select(k => new
                {
                    k.KeyResultId,
                    k.Title,
                    k.TargetValue,
                    k.CurrentValue
                })
            })
            .ToListAsync();

        return Ok(goals);
    }

    [HttpPost]
    public async Task<IActionResult> CreateGoal([FromBody] CreateGoalDto dto)
    {
        var userId = GetCurrentUserId();

        var isMember = await _context.WorkspaceMembers
            .AnyAsync(m => m.WorkspaceId == dto.WorkspaceId && m.UserId == userId);

        if (!isMember)
        {
            return Forbid();
        }

        var goal = new Goal
        {
            WorkspaceId = dto.WorkspaceId,
            Title = dto.Title,
            Description = dto.Description,
            TargetValue = dto.TargetValue,
            Unit = dto.Unit ?? "percent",
            StartDate = dto.StartDate,
            Deadline = dto.Deadline,
            OwnerId = userId
        };

        _context.Goals.Add(goal);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetGoals), new { workspaceId = goal.WorkspaceId }, goal);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateGoal(Guid id, [FromBody] UpdateGoalDto dto)
    {
        var userId = GetCurrentUserId();
        var goal = await _context.Goals.FindAsync(id);

        if (goal == null)
            return NotFound();

        var isMember = await _context.WorkspaceMembers
            .AnyAsync(m => m.WorkspaceId == goal.WorkspaceId && m.UserId == userId);

        if (!isMember) return Forbid();

        if (dto.Title != null) goal.Title = dto.Title;
        if (dto.Description != null) goal.Description = dto.Description;
        if (dto.TargetValue.HasValue) goal.TargetValue = dto.TargetValue.Value;
        if (dto.CurrentValue.HasValue) goal.CurrentValue = dto.CurrentValue.Value;
        if (dto.Unit != null) goal.Unit = dto.Unit;
        if (dto.Status != null) goal.Status = dto.Status;
        if (dto.StartDate.HasValue) goal.StartDate = dto.StartDate.Value;
        if (dto.Deadline.HasValue) goal.Deadline = dto.Deadline.Value;

        goal.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(goal);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGoal(Guid id)
    {
        var userId = GetCurrentUserId();
        var goal = await _context.Goals.FindAsync(id);

        if (goal == null) return NotFound();

        var member = await _context.WorkspaceMembers
            .FirstOrDefaultAsync(m => m.WorkspaceId == goal.WorkspaceId && m.UserId == userId);

        if (member == null) return Forbid();
        if (member.Role != "Admin" && goal.OwnerId != userId) return Forbid(); // Only admin or owner can delete

        _context.Goals.Remove(goal);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // --- Key Results ---

    [HttpPost("{goalId}/keyresults")]
    public async Task<IActionResult> AddKeyResult(Guid goalId, [FromBody] CreateKeyResultDto dto)
    {
        var goal = await _context.Goals.FindAsync(goalId);
        if (goal == null) return NotFound();

        var userId = GetCurrentUserId();
        var isMember = await _context.WorkspaceMembers
            .AnyAsync(m => m.WorkspaceId == goal.WorkspaceId && m.UserId == userId);
        
        if (!isMember) return Forbid();

        var kr = new KeyResult
        {
            GoalId = goalId,
            Title = dto.Title,
            TargetValue = dto.TargetValue,
            CurrentValue = 0
        };

        _context.KeyResults.Add(kr);
        await _context.SaveChangesAsync();

        return Ok(kr);
    }

    [HttpPut("keyresults/{id}")]
    public async Task<IActionResult> UpdateKeyResult(Guid id, [FromBody] UpdateKeyResultDto dto)
    {
        var kr = await _context.KeyResults
            .Include(k => k.Goal)
            .FirstOrDefaultAsync(k => k.KeyResultId == id);
            
        if (kr == null || kr.Goal == null) return NotFound();

        var userId = GetCurrentUserId();
        var isMember = await _context.WorkspaceMembers
            .AnyAsync(m => m.WorkspaceId == kr.Goal.WorkspaceId && m.UserId == userId);
            
        if (!isMember) return Forbid();

        if (dto.Title != null) kr.Title = dto.Title;
        if (dto.TargetValue.HasValue) kr.TargetValue = dto.TargetValue.Value;
        if (dto.CurrentValue.HasValue) kr.CurrentValue = dto.CurrentValue.Value;
        
        kr.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        
        // Auto-update Goal progress (optional logic depending on requirements, simple average here)
        var goal = kr.Goal;
        var allKrs = await _context.KeyResults.Where(k => k.GoalId == goal.GoalId).ToListAsync();
        if (allKrs.Any())
        {
            // E.g. Goal progress is average % of Key Results
            decimal totalPercent = 0;
            foreach (var k in allKrs)
            {
                if (k.TargetValue > 0)
                {
                    totalPercent += (k.CurrentValue / k.TargetValue) * 100m;
                }
            }
            goal.CurrentValue = totalPercent / allKrs.Count;
            await _context.SaveChangesAsync();
        }

        return Ok(kr);
    }
    
    [HttpDelete("keyresults/{id}")]
    public async Task<IActionResult> DeleteKeyResult(Guid id)
    {
        var kr = await _context.KeyResults
            .Include(k => k.Goal)
            .FirstOrDefaultAsync(k => k.KeyResultId == id);
            
        if (kr == null || kr.Goal == null) return NotFound();

        var userId = GetCurrentUserId();
        var member = await _context.WorkspaceMembers
            .FirstOrDefaultAsync(m => m.WorkspaceId == kr.Goal.WorkspaceId && m.UserId == userId);
            
        if (member == null) return Forbid();

        _context.KeyResults.Remove(kr);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
