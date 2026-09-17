using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Infrastructure.Data;
using TaskManagementApp.Infrastructure.Services;

namespace TaskManagementApp.API;

public class EmailRemindersService : BackgroundService
{
    private readonly ILogger<EmailRemindersService> _logger;
    private readonly IConfiguration _config;
    private readonly IServiceScopeFactory _scopeFactory;

    public EmailRemindersService(ILogger<EmailRemindersService> logger, IConfiguration config, IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _config = config;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EmailRemindersService started at {time}", DateTimeOffset.Now);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SendDueSoonReminders(stoppingToken);
                await SendDueTodayReminders(stoppingToken);
                await SendOverdueReminders(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in EmailRemindersService: {Message}", ex.Message);
            }

            await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
        }

        _logger.LogInformation("EmailRemindersService stopping at {time}", DateTimeOffset.Now);
    }

    private async Task SendDueSoonReminders(CancellationToken ct)
    {
        var reminderHours = _config.GetValue<int>("Reminders:DueSoonHours", 24);
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TaskManagementAppContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var now = DateTime.UtcNow;
        var threshold = now.AddHours(reminderHours);

        var tasks = await db.Tasks
            .AsNoTracking()
            .Include(t => t.Owner)
            .Include(t => t.TaskAssignments).ThenInclude(a => a.User)
            .Where(t => t.DueDate != null
                        && t.DueDate > now
                        && t.DueDate <= threshold
                        && t.Status != "Done"
                        && t.LastReminderSent == null
                        && t.ReminderEnabled == true)
            .ToListAsync(ct);

        foreach (var task in tasks)
        {
            var recipients = new List<(string email, string name)>();
            recipients.Add((task.Owner.Email, task.Owner.FullName ?? task.Owner.Email));
            foreach (var assignee in task.TaskAssignments)
            {
                if (assignee.User != null && !recipients.Any(r => r.email == assignee.User.Email))
                    recipients.Add((assignee.User.Email, assignee.User.FullName ?? assignee.User.Email));
            }

            foreach (var (email, name) in recipients)
            {
                var subject = $"[DoneIt] Nhắc nhở: \"{task.Title}\" sắp đến hạn";
                var htmlBody = $@"<html><body>
<h3>Hey {name}!</h3>
<p>Công việc <strong>{task.Title}</strong> của bạn sẽ đến hạn vào lúc <strong>{task.DueDate:yyyy-MM-dd HH:mm}</strong>.</p>
<p>Vui lòng cập nhật tiến độ hoặc hoàn thành công việc trước khi hạn.</p>
<p>— Nhóm DoneIt</p>
</body></html>";
                try { await emailService.SendAsync(email, subject, htmlBody); }
                catch (Exception ex) { _logger.LogWarning(ex, "Failed to send due-soon reminder for task {TaskId} to {Email}", task.TaskId, email); }
            }

            task.LastReminderSent = now;
            await db.SaveChangesAsync(ct);
        }
    }

    private async Task SendDueTodayReminders(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TaskManagementAppContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var now = DateTime.UtcNow;
        var todayEnd = now.Date.AddDays(1).AddMinutes(-1);

        var tasks = await db.Tasks
            .AsNoTracking()
            .Include(t => t.Owner)
            .Include(t => t.TaskAssignments).ThenInclude(a => a.User)
            .Where(t => t.DueDate != null
                        && t.DueDate <= todayEnd
                        && t.DueDate > now
                        && t.Status != "Done"
                        && t.ReminderEnabled == true)
            .ToListAsync(ct);

        foreach (var task in tasks)
        {
            var recipients = new List<(string email, string name)>();
            recipients.Add((task.Owner.Email, task.Owner.FullName ?? task.Owner.Email));
            foreach (var assignee in task.TaskAssignments)
            {
                if (assignee.User != null && !recipients.Any(r => r.email == assignee.User.Email))
                    recipients.Add((assignee.User.Email, assignee.User.FullName ?? assignee.User.Email));
            }

            foreach (var (email, name) in recipients)
            {
                var subject = $"[DoneIt] Nhắc nhở hôm nay: \"{task.Title}\" đến hạn hôm nay";
                var htmlBody = $@"<html><body>
<h3>Hey {name}!</h3>
<p>Công việc <strong>{task.Title}</strong> của bạn <strong>đến hạn hôm nay</strong> ({task.DueDate:yyyy-MM-dd}).</p>
<p>Vui lòng hoàn thành hoặc cập nhật trạng thái công việc.</p>
<p>— Nhóm DoneIt</p>
</body></html>";
                try { await emailService.SendAsync(email, subject, htmlBody); }
                catch (Exception ex) { _logger.LogWarning(ex, "Failed to send due-today reminder for task {TaskId}", task.TaskId); }
            }
        }
    }

    private async Task SendOverdueReminders(CancellationToken ct)
    {
        var overdueDays = _config.GetValue<int>("Reminders:OverdueDays", 1);
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TaskManagementAppContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var now = DateTime.UtcNow;
        var threshold = now.AddDays(-overdueDays);

        var tasks = await db.Tasks
            .AsNoTracking()
            .Include(t => t.Owner)
            .Include(t => t.TaskAssignments).ThenInclude(a => a.User)
            .Where(t => t.DueDate != null
                        && t.DueDate <= threshold
                        && t.Status != "Done"
                        && t.ReminderSent == false)
            .ToListAsync(ct);

        foreach (var task in tasks)
        {
            var recipients = new List<(string email, string name)>();
            recipients.Add((task.Owner.Email, task.Owner.FullName ?? task.Owner.Email));
            foreach (var assignee in task.TaskAssignments)
            {
                if (assignee.User != null && !recipients.Any(r => r.email == assignee.User.Email))
                    recipients.Add((assignee.User.Email, assignee.User.FullName ?? assignee.User.Email));
            }

            foreach (var (email, name) in recipients)
            {
                var subject = $"[DoneIt] Cảnh báo trễ hạn: \"{task.Title}\" đã quá hạn";
                var htmlBody = $@"<html><body>
<h3>Hey {name}!</h3>
<p>Công việc <strong>{task.Title}</strong> của bạn <strong>đã quá hạn</strong> từ {task.DueDate:yyyy-MM-dd}.</p>
<p>Vui lòng cập nhật trạng thái hoặc liên hệ người quản lý.</p>
<p> — Nhóm DoneIt</p>
</body></html>";
                try { await emailService.SendAsync(email, subject, htmlBody); }
                catch (Exception ex) { _logger.LogWarning(ex, "Failed to send overdue reminder for task {TaskId}", task.TaskId); }
            }

            task.ReminderSent = true;
            await db.SaveChangesAsync(ct);
        }
    }
}
