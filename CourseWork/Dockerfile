FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["CourseWork/CourseWork.csproj", "CourseWork/"]
RUN dotnet restore "CourseWork/CourseWork.csproj"
COPY . .
WORKDIR "/src/CourseWork"
RUN dotnet build "CourseWork.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CourseWork.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:80
ENTRYPOINT ["dotnet", "CourseWork.dll"]
