using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Models;

namespace TaskManagementApp.Services;

public static class AdminSeeder
{
    public static async System.Threading.Tasks.Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TaskManagementAppContext>();
        var hasAdmin = await db.Users.AnyAsync(u => u.Role == "Admin");
        if (!hasAdmin)
        {
            var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
            var admin = new User
            {
                UserId = Guid.NewGuid(),
                Email = "admin@example.com",
                FullName = "Administrator",
                Role = "Admin",
                PasswordHash = passwordHasher.HashPassword("Admin@123"),
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(admin);
            await db.SaveChangesAsync();
        }
    }
}


