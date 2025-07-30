export type FormatType = "markdown" | "plain";
export type ViewType = "summary" | "detailed";

export interface FormatOptions {
    format: FormatType;
    view: ViewType;
}

export abstract class BaseFormatter {
    protected formatType: FormatType;
    protected view: ViewType;

    constructor(options: FormatOptions) {
        this.formatType = options.format;
        this.view = options.view;
    }

    protected isMarkdown(): boolean {
        return this.formatType === "markdown";
    }

    protected isDetailed(): boolean {
        return this.view === "detailed";
    }

    protected createHeader(title: string, level: number = 1): string {
        if (this.isMarkdown()) {
            return `${"#".repeat(level)} ${title}\n\n`;
        }
        return `${title}\n\n`;
    }

    protected createTable(headers: string[], rows: string[][]): string {
        if (this.isMarkdown()) {
            let table = `| ${headers.join(" | ")} |\n`;
            table += `|${headers.map(() => "----").join("|")}|\n`;

            for (const row of rows) {
                table += `| ${row.join(" | ")} |\n`;
            }
            return table + "\n";
        }

        // Plain text table
        let result = "";
        for (const row of rows) {
            result += row.join(" | ") + "\n";
        }
        return result + "\n";
    }

    protected createList(items: string[], ordered: boolean = false): string {
        if (this.isMarkdown()) {
            return (
                items
                    .map((item, index) =>
                        ordered ? `${index + 1}. ${item}` : `- ${item}`
                    )
                    .join("\n") + "\n\n"
            );
        }

        return (
            items
                .map((item, index) =>
                    ordered ? `${index + 1}. ${item}` : `- ${item}`
                )
                .join("\n") + "\n\n"
        );
    }

    protected createCodeBlock(code: string, language: string = ""): string {
        if (this.isMarkdown()) {
            return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
        }
        return `${code}\n\n`;
    }

    protected createLink(text: string, url: string): string {
        if (this.isMarkdown()) {
            return `[${text}](${url})`;
        }
        return `${text}: ${url}`;
    }

    protected createBold(text: string): string {
        if (this.isMarkdown()) {
            return `**${text}**`;
        }
        return text;
    }

    protected createSeparator(): string {
        if (this.isMarkdown()) {
            return "\n---\n\n";
        }
        return "\n" + "-".repeat(50) + "\n\n";
    }

    abstract formatData(data: any): string;
}
