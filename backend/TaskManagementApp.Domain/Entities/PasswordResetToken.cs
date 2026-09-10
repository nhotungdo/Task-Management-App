namespace TaskManagementApp.Domain.Entities;

public class PasswordResetToken
{
    public Guid PasswordResetTokenId { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool Used { get; set; }

    public virtual User User { get; set; } = null!;
}


