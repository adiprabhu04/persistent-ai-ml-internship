using Microsoft.EntityFrameworkCore;

public class NotesDbContext : DbContext
{
    public NotesDbContext(DbContextOptions<NotesDbContext> options)
        : base(options) { }

    public DbSet<Note> Notes => Set<Note>();
    public DbSet<User> Users => Set<User>();
}
