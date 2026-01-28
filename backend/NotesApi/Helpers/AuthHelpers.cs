using System.Security.Claims;

public static class AuthHelpers
{
    public static Guid GetUserId(HttpContext context)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? context.User.FindFirstValue("sub");

        // Fix: If userId is null or empty, return an empty Guid instead of crashing
        if (string.IsNullOrEmpty(userId))
        {
            return Guid.Empty; 
        }

        return Guid.Parse(userId);
    }
}