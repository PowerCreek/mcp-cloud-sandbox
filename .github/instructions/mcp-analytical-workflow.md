# Instructions for Using MCP Tools for Analytical Workflow

## Purpose
This guide explains how to use the following MCP tools to support stepwise, persistent, and collaborative analytical work:
- sequential-thinking
- context7
- neo4j-memory
- supabase

## Workflow Steps

### 1. Use `sequential-thinking` for Stepwise Reasoning
- Break down complex tasks into clear, logical steps.
- Use the tool to document each thought, decision, and revision as you progress.
- Revise or branch your reasoning as new information or issues arise.
- Example: "What are the steps to debug a failing deployment?"

### 2. Use `context7` for Contextual Search and Retrieval
- Search for relevant code, documentation, or prior solutions in your workspace or external sources.
- Use it to quickly gather background or reference material for the current task.
- Example: "Find all usages of the login function in the codebase."

### 3. Use `neo4j-memory` to Persist Analytical Understanding
- Store key entities, relationships, and observations from your analysis in the knowledge graph.
- Add new insights, issues, or decisions as nodes and relations.
- Use the graph to recall context, track dependencies, and visualize your analytical process.
- Example: "Add a node for 'API Outage' and relate it to 'Deployment Issue'."

### 4. Use `supabase` for Data and State Management
- Query, update, or persist structured data related to your tasks.
- Use it to store logs, results, or state snapshots for reproducibility.
- Example: "Save the results of the latest test run to the supabase database."

## Best Practices
- Use `sequential-thinking` to drive the workflow and document your reasoning.
- Use `context7` and `neo4j-memory` to gather and persist context as you go.
- Use `supabase` for structured data and results that need to be shared or queried later.
- Regularly update the knowledge graph and database with new findings and decisions.

---

By combining these tools, you can maintain a persistent, stepwise, and collaborative record of your analytical work, making it easier to revisit, share, and build on your progress.
