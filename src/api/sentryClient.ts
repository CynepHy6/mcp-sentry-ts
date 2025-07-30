import fetch, { RequestInit } from "node-fetch";

export class SentryApiClient {
    private baseUrl: string;
    private authToken: string;

    constructor(host: string, authToken: string) {
        this.baseUrl = host;
        this.authToken = authToken;
    }

    private async makeRequest(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<any> {
        const url = `${this.baseUrl}/api/0${endpoint}`;

        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.authToken}`,
            "Content-Type": "application/json",
        };

        if (options.headers) {
            Object.assign(headers, options.headers);
        }

        const requestOptions: RequestInit = {
            ...options,
            headers,
        };

        const response = await fetch(url, requestOptions);

        return response;
    }

    async get(endpoint: string): Promise<any> {
        const response = await this.makeRequest(endpoint, { method: "GET" });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `API request failed: ${response.status} ${response.statusText} - ${errorText}`
            );
        }

        return response.json();
    }

    async post(endpoint: string, body: any): Promise<any> {
        const response = await this.makeRequest(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `API request failed: ${response.status} ${response.statusText} - ${errorText}`
            );
        }

        return response.json();
    }

    // Projects
    async getProjects(organizationSlug: string) {
        return this.get(`/organizations/${organizationSlug}/projects/`);
    }

    async createProject(
        organizationSlug: string,
        teamSlug: string,
        projectData: any
    ) {
        return this.post(
            `/teams/${organizationSlug}/${teamSlug}/projects/`,
            projectData
        );
    }

    async getProjectIssues(
        organizationSlug: string,
        projectSlug: string,
        query?: string
    ) {
        const endpoint = `/projects/${organizationSlug}/${projectSlug}/issues/`;
        return this.get(
            query ? `${endpoint}?query=${encodeURIComponent(query)}` : endpoint
        );
    }

    async getProjectEvents(organizationSlug: string, projectSlug: string) {
        return this.get(`/projects/${organizationSlug}/${projectSlug}/events/`);
    }

    async getProjectKeys(organizationSlug: string, projectSlug: string) {
        return this.get(`/projects/${organizationSlug}/${projectSlug}/keys/`);
    }

    // Issues
    async getIssue(organizationSlug: string, issueId: string) {
        return this.get(
            `/organizations/${organizationSlug}/issues/${issueId}/`
        );
    }

    async getIssueEvents(
        organizationSlug: string,
        issueId: string,
        full: boolean = false
    ) {
        const endpoint = `/issues/${issueId}/events/`;
        return this.get(full ? `${endpoint}?full=true` : endpoint);
    }

    async resolveShortId(organizationSlug: string, shortId: string) {
        return this.get(
            `/organizations/${organizationSlug}/shortids/${shortId}/`
        );
    }

    async getEventById(organizationSlug: string, eventId: string) {
        return this.get(
            `/organizations/${organizationSlug}/eventids/${eventId}/`
        );
    }

    // Replays
    async getReplays(
        organizationSlug: string,
        params: Record<string, string> = {}
    ) {
        const queryParams = new URLSearchParams(params);
        const endpoint = `/organizations/${organizationSlug}/replays/`;
        return this.get(
            queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint
        );
    }

    async getIssueEvent(
        organizationSlug: string,
        issueId: string,
        eventId: string
    ): Promise<any> {
        // First get the issue to find which project it belongs to
        const issue = await this.getIssue(organizationSlug, issueId);
        const projectSlug = issue.project.slug;

        // Then get the event from the project
        const endpoint = `/projects/${organizationSlug}/${projectSlug}/events/${eventId}/`;
        return this.get(endpoint);
    }
}
