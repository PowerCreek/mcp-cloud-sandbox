# Agentic AI Development Sandbox

This sandbox provides a cloud-first, stateless, disaster-resilient development environment for agentic AI and MCP tools. All persistent state is managed in cloud services (Supabase, Neo4j, Context7). The sandbox is orchestrated with Docker Compose for reproducibility and cognitive inheritance.

## Features
- Isolated, reproducible agentic development environment
- Pre-installed MCP tools: Context7, Supabase, Neo4j suite, Sequential Thinking
- Environment variables injected via `.env` for secure tool access
- Real-time, meta-cognitive capture of implementation context
- Supports hot-reloading and ephemeral workspaces

## Usage
1. Copy `.env.example` to `.env` and fill in your secrets.
2. Run `docker-compose up --build` in this directory.
3. Develop inside the `agentic-sandbox` container, which has all tools and code mounted.

## Cognitive Rationale
- Every build step and config is documented for cognitive inheritance.
- The system is designed for disaster recovery and stateless operation.
- All environment variables are injected at runtime for security and flexibility.

## Extending
- Add new services to `docker-compose.yml` as needed.
- Update `.env.example` with new required variables.

---

*This setup is the foundation for a living, self-documenting, agentic cognitive system.*
