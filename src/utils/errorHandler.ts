export interface ErrorResponse {
    [x: string]: unknown;
    content: Array<{
        type: "text";
        text: string;
    }>;
    isError: true;
}

export class ErrorHandler {
    static handleApiError(error: Error, context: string): ErrorResponse {
        console.error(`Error in ${context}:`, error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error in ${context}: ${error.message}`,
                },
            ],
            isError: true,
        };
    }

    static handleValidationError(message: string): ErrorResponse {
        return {
            content: [
                {
                    type: "text",
                    text: `Validation error: ${message}`,
                },
            ],
            isError: true,
        };
    }

    static handleNotFoundError(
        resource: string,
        identifier: string
    ): ErrorResponse {
        return {
            content: [
                {
                    type: "text",
                    text: `${resource} not found: ${identifier}`,
                },
            ],
            isError: true,
        };
    }
}
