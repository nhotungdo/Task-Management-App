using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Domain.Entities;
using TaskManagementApp.Infrastructure.Data;

namespace TaskManagementApp.Controllers;

[ApiController]
[Route("api/workspaces/{workspaceId:guid}/custom-fields")]
[Authorize]
public class CustomFieldsController : ControllerBase
{
    private readonly TaskManagementAppContext _db;

    public CustomFieldsController(TaskManagementAppContext db)
    {
        _db = db;
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

    public record CustomFieldCreateDto(string Name, string FieldType = "Text", string? OptionsJson = null, bool IsRequired = false);
    public record CustomFieldUpdateDto(string? Name = null, string? FieldType = null, string? OptionsJson = null, bool? IsRequired = null, int? SortOrder = null);
    public record CustomFieldValueDto(Guid CustomFieldId, string? ValueText);

    [HttpGet]
    public async Task<IActionResult> GetCustomFields(Guid workspaceId)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(workspaceId, userId)) return Forbid();

        var fields = await _db.CustomFields
            .AsNoTracking()
            .Where(cf => cf.WorkspaceId == workspaceId)
            .OrderBy(cf => cf.SortOrder)
            .Select(cf => new {
                cf.CustomFieldId,
                cf.Name,
                cf.FieldType,
                cf.OptionsJson,
                cf.IsRequired,
                cf.SortOrder,
                cf.CreatedAt
            })
            .ToListAsync();

        return Ok(fields);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCustomField(Guid workspaceId, Guid id)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(workspaceId, userId)) return Forbid();

        var field = await _db.CustomFields.AsNoTracking()
            .FirstOrDefaultAsync(cf => cf.CustomFieldId == id && cf.WorkspaceId == workspaceId);
        if (field == null) return NotFound();
        return Ok(new { field.CustomFieldId, field.Name, field.FieldType, field.OptionsJson, field.IsRequired, field.SortOrder });
    }

    [HttpPost]
    public async Task<IActionResult> CreateCustomField(Guid workspaceId, [FromBody] CustomFieldCreateDto dto)
    {
        var userId = GetUserId();
        if (!await IsAdminAsync(workspaceId, userId)) return Forbid();

        var maxSort = await _db.CustomFields.Where(cf => cf.WorkspaceId == workspaceId).MaxAsync(cf => (int?)cf.SortOrder) ?? 0;

        var field = new CustomField
        {
            CustomFieldId = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            Name = dto.Name,
            FieldType = dto.FieldType,
            OptionsJson = dto.OptionsJson,
            IsRequired = dto.IsRequired,
            SortOrder = maxSort + 1,
            CreatedAt = DateTime.UtcNow
        };
        _db.CustomFields.Add(field);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCustomField), new { id = field.CustomFieldId, workspaceId }, field);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCustomField(Guid workspaceId, Guid id, [FromBody] CustomFieldUpdateDto dto)
    {
        var userId = GetUserId();
        if (!await IsAdminAsync(workspaceId, userId)) return Forbid();

        var field = await _db.CustomFields.FirstOrDefaultAsync(cf => cf.CustomFieldId == id && cf.WorkspaceId == workspaceId);
        if (field == null) return NotFound();

        if (dto.Name is not null) field.Name = dto.Name;
        if (dto.FieldType is not null) field.FieldType = dto.FieldType;
        if (dto.OptionsJson is not null) field.OptionsJson = dto.OptionsJson;
        if (dto.IsRequired.HasValue) field.IsRequired = dto.IsRequired.Value;
        if (dto.SortOrder.HasValue) field.SortOrder = dto.SortOrder.Value;

        await _db.SaveChangesAsync();
        return Ok(field);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCustomField(Guid workspaceId, Guid id)
    {
        var userId = GetUserId();
        if (!await IsAdminAsync(workspaceId, userId)) return Forbid();

        var field = await _db.CustomFields.FirstOrDefaultAsync(cf => cf.CustomFieldId == id && cf.WorkspaceId == workspaceId);
        if (field == null) return NotFound();

        _db.CustomFields.Remove(field);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("tasks/{taskId:guid}/values")]
    public async Task<IActionResult> GetTaskCustomFieldValues(Guid workspaceId, Guid taskId)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(workspaceId, userId)) return Forbid();

        var values = await _db.TaskCustomFieldValues
            .AsNoTracking()
            .Include(v => v.CustomField)
            .Where(v => v.TaskId == taskId && v.CustomField.WorkspaceId == workspaceId)
            .Select(v => new {
                v.CustomFieldId,
                CustomFieldName = v.CustomField.Name,
                CustomFieldType = v.CustomField.FieldType,
                v.ValueText
            })
            .ToListAsync();

        return Ok(values);
    }

    [HttpPost("tasks/{taskId:guid}/values")]
    public async Task<IActionResult> SetTaskCustomFieldValue(Guid workspaceId, Guid taskId, [FromBody] List<CustomFieldValueDto> dtos)
    {
        var userId = GetUserId();

        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskId == taskId && t.WorkspaceId == workspaceId);
        if (task == null) return NotFound();
        if (!await IsMemberAsync(workspaceId, userId)) return Forbid();

        var customFieldIds = dtos.Select(d => d.CustomFieldId).ToList();
        var validFields = await _db.CustomFields
            .Where(cf => cf.WorkspaceId == workspaceId && customFieldIds.Contains(cf.CustomFieldId))
            .ToListAsync();

        foreach (var dto in dtos)
        {
            if (!validFields.Any(f => f.CustomFieldId == dto.CustomFieldId)) continue;

            var existing = await _db.TaskCustomFieldValues
                .FirstOrDefaultAsync(v => v.TaskId == taskId && v.CustomFieldId == dto.CustomFieldId);

            if (existing != null)
            {
                existing.ValueText = dto.ValueText;
            }
            else
            {
                var value = new TaskCustomFieldValue
                {
                    TaskCustomFieldValueId = Guid.NewGuid(),
                    TaskId = taskId,
                    CustomFieldId = dto.CustomFieldId,
                    ValueText = dto.ValueText,
                    CreatedAt = DateTime.UtcNow
                };
                _db.TaskCustomFieldValues.Add(value);
            }
        }
        await _db.SaveChangesAsync();
        return Ok();
    }
}
