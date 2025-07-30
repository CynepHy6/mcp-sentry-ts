#!/usr/bin/env ts-node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SentryApiClient } from "./api/sentryClient";
import { IssueFormatter } from "./formatters/issueFormatter";
import { ProjectFormatter } from "./formatters/projectFormatter";
import { ErrorHandler } from "./utils/errorHandler";

// Validate environment variables
const SENTRY_AUTH = process.env.SENTRY_AUTH;
if (!SENTRY_AUTH) {
    console.error("Error: SENTRY_AUTH environment variable is required");
    process.exit(1);
}

const PROTOCOL = process.env.PROTOCOL || "https";
let sentryHost = process.env.SENTRY_HOST || "sentry.io";
if (
    sentryHost &&
    !sentryHost.startsWith("http://") &&
    !sentryHost.startsWith("https://")
) {
    sentryHost = `${PROTOCOL}://${sentryHost}`;
}

// Initialize API client
const apiClient = new SentryApiClient(sentryHost, SENTRY_AUTH);

// Initialize server
const server = new McpServer({
    name: "Sentry",
    version: "1.0.0",
});

// List projects tool
server.tool(
    "list_projects",
    "List accessible Sentry projects. View project slugs, IDs, status, settings, features, and organization details.",
    {
        organization_slug: z
            .string()
            .describe("The slug of the organization to list projects from"),
        view: z
            .enum(["summary", "detailed"])
            .default("detailed")
            .describe("View type (default: detailed)"),
        format: z
            .enum(["plain", "markdown"])
            .default("markdown")
            .describe("Output format (default: markdown)"),
    },
    async ({
        organization_slug,
        view,
        format,
    }: {
        organization_slug: string;
        view: "summary" | "detailed";
        format: "plain" | "markdown";
    }) => {
        try {
            const projects = await apiClient.getProjects(organization_slug);

            const formatter = new ProjectFormatter({ format, view });
            const output = formatter.formatData(projects);

            return {
                content: [
                    {
                        type: "text" as const,
                        text: output,
                    },
                ],
            };
        } catch (error) {
            return ErrorHandler.handleApiError(error as Error, "list_projects");
        }
    }
);

// List project issues tool
server.tool(
    "list_project_issues",
    "List issues from a Sentry project. Monitor issue status, severity, frequency, and timing.",
    {
        organization_slug: z
            .string()
            .describe("The slug of the organization the project belongs to"),
        project_slug: z
            .string()
            .describe("The slug of the project to list issues from"),
        view: z
            .enum(["summary", "detailed"])
            .default("detailed")
            .describe("View type (default: detailed)"),
        format: z
            .enum(["plain", "markdown"])
            .default("markdown")
            .describe("Output format (default: markdown)"),
    },
    async ({
        organization_slug,
        project_slug,
        view,
        format,
    }: {
        organization_slug: string;
        project_slug: string;
        view: "summary" | "detailed";
        format: "plain" | "markdown";
    }) => {
        try {
            const issues = await apiClient.getProjectIssues(
                organization_slug,
                project_slug
            );

            const formatter = new IssueFormatter({ format, view });
            const output = formatter.formatIssueList(issues, project_slug);

            return {
                content: [
                    {
                        type: "text" as const,
                        text: output,
                    },
                ],
            };
        } catch (error) {
            return ErrorHandler.handleApiError(
                error as Error,
                "list_project_issues"
            );
        }
    }
);

// Get Sentry issue tool
server.tool(
    "get_sentry_issue",
    "Retrieve and analyze a Sentry issue. Accepts issue URL or ID.",
    {
        issue_id_or_url: z
            .string()
            .describe(
                "Either a full Sentry issue URL or just the numeric issue ID"
            ),
        organization_slug: z
            .string()
            .describe("The slug of the organization the issue belongs to"),
        view: z
            .enum(["summary", "detailed"])
            .default("detailed")
            .describe("View type (default: detailed)"),
        format: z
            .enum(["plain", "markdown"])
            .default("markdown")
            .describe("Output format (default: markdown)"),
    },
    async ({
        issue_id_or_url,
        organization_slug,
        view,
        format,
    }: {
        issue_id_or_url: string;
        organization_slug: string;
        view: "summary" | "detailed";
        format: "plain" | "markdown";
    }) => {
        try {
            // Extract issue ID from URL if provided
            let issueId = issue_id_or_url;
            if (issue_id_or_url.startsWith("http")) {
                const url = new URL(issue_id_or_url);
                const pathParts = url.pathname
                    .split("/")
                    .filter((part) => part);
                if (pathParts.length >= 4 && pathParts[2] === "issues") {
                    issueId = pathParts[3];
                }
            }

            const issue = await apiClient.getIssue(organization_slug, issueId);

            const formatter = new IssueFormatter({ format, view });
            const output = formatter.formatIssueDetails(issue);

            return {
                content: [
                    {
                        type: "text" as const,
                        text: output,
                    },
                ],
            };
        } catch (error) {
            return ErrorHandler.handleApiError(
                error as Error,
                "get_sentry_issue"
            );
        }
    }
);

// List issue events tool
server.tool(
    "list_issue_events",
    "List events for a specific Sentry issue. Analyze event details, metadata, and patterns.",
    {
        organization_slug: z
            .string()
            .describe("The slug of the organization the issue belongs to"),
        issue_id: z.string().describe("The ID of the issue to list events for"),
        view: z
            .enum(["summary", "detailed"])
            .default("detailed")
            .describe("View type (default: detailed)"),
        format: z
            .enum(["plain", "markdown"])
            .default("markdown")
            .describe("Output format (default: markdown)"),
    },
    async ({
        organization_slug,
        issue_id,
        view,
        format,
    }: {
        organization_slug: string;
        issue_id: string;
        view: "summary" | "detailed";
        format: "plain" | "markdown";
    }) => {
        try {
            const events = await apiClient.getIssueEvents(
                organization_slug,
                issue_id
            );

            const formatter = new IssueFormatter({ format, view });
            const output = formatter.formatEventList(
                events,
                `Issue ${issue_id}`
            );

            return {
                content: [
                    {
                        type: "text" as const,
                        text: output,
                    },
                ],
            };
        } catch (error) {
            return ErrorHandler.handleApiError(
                error as Error,
                "list_issue_events"
            );
        }
    }
);

// Resolve short ID tool
server.tool(
    "resolve_short_id",
    "Retrieve details about an issue using its short ID. Maps short IDs to issue details, project context, and status.",
    {
        organization_slug: z
            .string()
            .describe("The slug of the organization the issue belongs to"),
        short_id: z
            .string()
            .describe(
                "The short ID of the issue to resolve (e.g., PROJECT-123)"
            ),
        format: z
            .enum(["plain", "markdown"])
            .default("markdown")
            .describe("Output format (default: markdown)"),
    },
    async ({
        organization_slug,
        short_id,
        format,
    }: {
        organization_slug: string;
        short_id: string;
        format: "plain" | "markdown";
    }) => {
        try {
            const data = await apiClient.resolveShortId(
                organization_slug,
                short_id
            );

            let output = "";
            if (format === "markdown") {
                output = `# Issue Details: ${data.shortId}\n\n`;
                output += `## Issue Information\n\n`;
                output += `- **Title**: ${data.group.title}\n`;
                output += `- **Status**: ${data.group.status}\n`;
                output += `- **Level**: ${data.group.level}\n`;
                output += `- **Event Count**: ${data.group.count}\n`;
                output += `- **User Count**: ${data.group.userCount}\n`;
                output += `- **Permalink**: [${data.group.permalink}](${data.group.permalink})\n`;
            } else {
                output = `Issue Details: ${data.shortId}\n\n`;
                output += `Title: ${data.group.title}\n`;
                output += `Status: ${data.group.status}\n`;
                output += `Level: ${data.group.level}\n`;
                output += `Event Count: ${data.group.count}\n`;
                output += `User Count: ${data.group.userCount}\n`;
                output += `Permalink: ${data.group.permalink}\n`;
            }

            return {
                content: [
                    {
                        type: "text" as const,
                        text: output,
                    },
                ],
            };
        } catch (error) {
            return ErrorHandler.handleApiError(
                error as Error,
                "resolve_short_id"
            );
        }
    }
);

// Extract issue context data tool
server.tool(
    "extract_issue_context_data",
    "Извлекает данные из Additional Context всех событий issue одним запросом",
    {
        organization_slug: z
            .string()
            .describe("The slug of the organization the issue belongs to"),
        issue_id: z
            .string()
            .describe("The ID of the issue to extract context data from"),
        extract_fields: z
            .array(z.string())
            .describe(
                "Поля для извлечения из contexts/extra (например: ['roomId', 'userId', 'message'])"
            ),
    },
    async ({
        organization_slug,
        issue_id,
        extract_fields,
    }: {
        organization_slug: string;
        issue_id: string;
        extract_fields: string[];
    }) => {
        try {
            const events = await apiClient.getIssueEvents(
                organization_slug,
                issue_id,
                true
            ); // full=true

            const extractedData: any[] = [];
            const uniqueValues: Record<string, Set<string>> = {};

            extract_fields.forEach((field) => {
                uniqueValues[field] = new Set();
            });

            events.forEach((event: any) => {
                const eventData: any = {
                    event_id: event.id,
                    timestamp: event.dateCreated,
                };

                // Extract from contexts, extra, context, and root
                const sources = [
                    event.contexts,
                    event.extra,
                    event.context,
                    event,
                ];

                extract_fields.forEach((field) => {
                    for (const source of sources) {
                        if (
                            source &&
                            source[field] !== undefined &&
                            eventData[field] === undefined
                        ) {
                            eventData[field] = source[field];
                            uniqueValues[field].add(String(source[field]));
                            break;
                        }
                    }
                });

                const hasData = extract_fields.some(
                    (field) => eventData[field] !== undefined
                );
                if (hasData) {
                    extractedData.push(eventData);
                }
            });

            const uniqueValuesResult: Record<string, string[]> = {};
            Object.keys(uniqueValues).forEach((field) => {
                uniqueValuesResult[field] = Array.from(
                    uniqueValues[field]
                ).sort();
            });

            const result = {
                extracted_data: extractedData,
                unique_values: uniqueValuesResult,
                total_events: events.length,
                events_with_data: extractedData.length,
            };

            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        } catch (error) {
            return ErrorHandler.handleApiError(
                error as Error,
                "extract_issue_context_data"
            );
        }
    }
);

// Get specific Sentry event tool
server.tool(
    "get_sentry_event",
    "Retrieve a specific Sentry event from an issue. Requires issue ID/URL and event ID. For URLs with events, event_id can be extracted automatically.",
    {
        issue_id_or_url: z
            .string()
            .describe(
                "Either a full Sentry issue URL or just the numeric issue ID"
            ),
        event_id: z.string().describe("The specific event ID to retrieve"),
        organization_slug: z
            .string()
            .describe("The slug of the organization the issue belongs to"),
        view: z
            .enum(["summary", "detailed"])
            .default("detailed")
            .describe("View type (default: detailed)"),
        format: z
            .enum(["plain", "markdown"])
            .default("markdown")
            .describe("Output format (default: markdown)"),
    },
    async ({
        issue_id_or_url,
        event_id,
        view,
        organization_slug,
        format,
    }: {
        issue_id_or_url: string;
        event_id: string;
        organization_slug: string;
        view: "summary" | "detailed";
        format: "plain" | "markdown";
    }) => {
        try {
            // Extract issue ID from URL if provided
            let issueId = issue_id_or_url;
            let organizationSlug = organization_slug;
            let extractedEventId = event_id;

            if (issue_id_or_url.startsWith("http")) {
                try {
                    const url = new URL(issue_id_or_url);
                    const pathParts = url.pathname
                        .split("/")
                        .filter((part) => part);

                    // URL structure: /organizations/{org}/issues/{issue_id}/events/{event_id}
                    if (
                        pathParts.length >= 2 &&
                        pathParts[0] === "organizations"
                    ) {
                        organizationSlug = pathParts[1];

                        if (
                            pathParts.length >= 4 &&
                            pathParts[2] === "issues"
                        ) {
                            issueId = pathParts[3];
                        }

                        // If URL contains events and we have an event_id in URL, use it
                        if (
                            pathParts.length >= 6 &&
                            pathParts[4] === "events"
                        ) {
                            extractedEventId = pathParts[5];
                        }
                    }
                } catch (e) {
                    // If URL parsing fails, use provided values
                }
            }

            const event = await apiClient.getIssueEvent(
                organizationSlug,
                issueId,
                extractedEventId
            );

            const formatter = new IssueFormatter({ format, view });

            // Use specialized single event formatter for better detail
            const output = formatter.formatSingleEvent(event, extractedEventId);

            return {
                content: [
                    {
                        type: "text",
                        text: output,
                    },
                ],
            };
        } catch (error: any) {
            return ErrorHandler.handleApiError(error, "get_sentry_event");
        }
    }
);

async function main(): Promise<void> {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Sentry MCP Server running");
    } catch (error: any) {
        throw error;
    }
}

main().catch((error: Error) => {
    console.error("Fatal error in main():", error);
});
