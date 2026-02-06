FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/NotesApi/NotesApi.csproj backend/NotesApi/
RUN dotnet restore "backend/NotesApi/NotesApi.csproj"

COPY backend/NotesApi/ backend/NotesApi/
RUN dotnet publish "backend/NotesApi/NotesApi.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app

RUN adduser -D -u 1000 appuser

COPY --from=build /app/publish .

RUN chown -R appuser:appuser /app
USER appuser

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_RUNNING_IN_CONTAINER=true

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "NotesApi.dll"]
