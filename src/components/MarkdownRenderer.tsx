import React, { useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import { useTheme } from "../hooks/useTheme";
import katex from "katex";
import "katex/dist/katex.min.css";

// Import mermaid dynamically to avoid SSR issues
let mermaid: any = null;

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Configure marked with better table and math handling
marked.setOptions({
  breaks: true,
  gfm: true,
  tables: true,
  headerIds: true,
  headerPrefix: "content-",
  sanitize: false,
});

// Custom renderer for better code and table handling
const renderer = new marked.Renderer();

// Enhanced table rendering
renderer.table = function (header: string, body: string) {
  return `<div class="table-container">
    <table class="markdown-table">
      <thead>${header}</thead>
      <tbody>${body}</tbody>
    </table>
  </div>`;
};

// Enhanced code block rendering with Mermaid support
renderer.code = function (code: string, language?: string) {
  const lang = language || "text";
  const langDisplay = lang === "text" ? "Code" : lang.toUpperCase();

  // Check if it's a Mermaid diagram
  if (lang === "mermaid") {
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
    return `<div class="mermaid-container">
      <div class="mermaid-header">
        <div class="code-dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <div class="code-language">MERMAID</div>
      </div>
      <div class="mermaid-diagram">
        <div class="mermaid-code" data-mermaid-id="${id}" style="display: none;">${code}</div>
        <div class="mermaid-output" id="mermaid-output-${id}"></div>
      </div>
    </div>`;
  }

  return `<div class="enhanced-code-block">
    <div class="code-header">
      <div class="code-dots">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <div class="code-language">${langDisplay}</div>
    </div>
    <pre class="code-content"><code class="language-${lang}">${code}</code></pre>
  </div>`;
};

marked.use({ renderer });

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize mermaid
  const initializeMermaid = useCallback(async () => {
    if (!mermaid) {
      try {
        const mermaidModule = await import("mermaid");
        mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          theme: theme === "dark" ? "dark" : "default",
          securityLevel: "loose",
          themeVariables: {
            primaryColor: theme === "dark" ? "#3b82f6" : "#2563eb",
            primaryTextColor: theme === "dark" ? "#f3f4f6" : "#1f2937",
            primaryBorderColor: theme === "dark" ? "#6b7280" : "#d1d5db",
            lineColor: theme === "dark" ? "#9ca3af" : "#6b7280",
            secondaryColor: theme === "dark" ? "#1f2937" : "#f9fafb",
            tertiaryColor: theme === "dark" ? "#374151" : "#ffffff",
            background: theme === "dark" ? "#111827" : "#ffffff",
            mainBkg: theme === "dark" ? "#1f2937" : "#ffffff",
            secondBkg: theme === "dark" ? "#374151" : "#f3f4f6",
            tertiaryBkg: theme === "dark" ? "#4b5563" : "#e5e7eb",
          },
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
            padding: 15,
          },
          sequence: {
            useMaxWidth: true,
            wrap: true,
            width: 150,
            height: 65,
          },
          gantt: {
            useMaxWidth: true,
            leftPadding: 75,
            rightPadding: 20,
            topPadding: 50,
            bottomPadding: 50,
            gridLineStartPadding: 35,
            fontSize: 11,
            fontFamily: '"Inter", sans-serif',
            sectionFontSize: 24,
            numberSectionStyles: 4,
          },
        });
      } catch (error) {
        console.error("Failed to load Mermaid:", error);
      }
    } else {
      // Reinitialize with current theme
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === "dark" ? "dark" : "default",
        securityLevel: "loose",
        themeVariables: {
          primaryColor: theme === "dark" ? "#3b82f6" : "#2563eb",
          primaryTextColor: theme === "dark" ? "#f3f4f6" : "#1f2937",
          primaryBorderColor: theme === "dark" ? "#6b7280" : "#d1d5db",
          lineColor: theme === "dark" ? "#9ca3af" : "#6b7280",
          secondaryColor: theme === "dark" ? "#1f2937" : "#f9fafb",
          tertiaryColor: theme === "dark" ? "#374151" : "#ffffff",
          background: theme === "dark" ? "#111827" : "#ffffff",
          mainBkg: theme === "dark" ? "#1f2937" : "#ffffff",
          secondBkg: theme === "dark" ? "#374151" : "#f3f4f6",
          tertiaryBkg: theme === "dark" ? "#4b5563" : "#e5e7eb",
        },
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: "basis",
          padding: 15,
        },
      });
    }
  }, [theme]);

  // Process Mermaid diagrams after content is rendered
  const processMermaidDiagrams = useCallback(async () => {
    if (!containerRef.current || !mermaid) return;

    const mermaidContainers =
      containerRef.current.querySelectorAll(".mermaid-code");

    for (let i = 0; i < mermaidContainers.length; i++) {
      const codeElement = mermaidContainers[i] as HTMLElement;
      const code = codeElement.textContent?.trim() || "";
      const id = codeElement.getAttribute("data-mermaid-id") || `mermaid-${i}`;
      const outputElement = containerRef.current.querySelector(
        `#mermaid-output-${id}`,
      ) as HTMLElement;

      if (!outputElement || !code) continue;

      try {
        console.log("Processing Mermaid diagram:", { id, code });

        // Clear previous content
        outputElement.innerHTML = "";

        // Validate the syntax first
        const isValid = await mermaid.parse(code);
        if (!isValid) {
          throw new Error("Invalid Mermaid syntax");
        }

        // Render the diagram
        const { svg, bindFunctions } = await mermaid.render(
          `mermaid-svg-${id}`,
          code,
        );

        // Insert the SVG
        outputElement.innerHTML = svg;

        // Bind any interactive functions
        if (bindFunctions) {
          bindFunctions(outputElement);
        }

        // Style the SVG
        const svgElement = outputElement.querySelector("svg");
        if (svgElement) {
          svgElement.style.maxWidth = "100%";
          svgElement.style.height = "auto";
          svgElement.style.display = "block";
          svgElement.style.margin = "0 auto";
        }

        console.log("Successfully rendered Mermaid diagram:", id);
      } catch (error) {
        console.error(`Error rendering Mermaid diagram ${id}:`, error);
        console.error("Code that failed:", code);

        // Show error message
        outputElement.innerHTML = `
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                        <div class="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                            <span class="font-medium">Mermaid Diagram Error</span>
                        </div>
                        <p class="text-sm text-red-600 dark:text-red-300 mb-2">
                            Failed to render diagram: ${error instanceof Error ? error.message : "Unknown error"}
                        </p>
                        <details class="mt-2">
                            <summary class="text-sm text-red-600 dark:text-red-300 cursor-pointer">Show diagram code</summary>
                            <pre class="mt-2 text-xs text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-2 rounded overflow-x-auto whitespace-pre-wrap">${code}</pre>
                        </details>
                    </div>
                `;
      }
    }
  }, []);

  // Initialize and process diagrams
  useEffect(() => {
    const processAll = async () => {
      await initializeMermaid();
      // Small delay to ensure DOM is ready
      setTimeout(processMermaidDiagrams, 100);
    };

    processAll();
  }, [content, initializeMermaid, processMermaidDiagrams]);

  // Enhanced LaTeX parsing function
  const processLatex = (text: string): string => {
    // Handle display math blocks: $$...$$
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
      try {
        const html = katex.renderToString(latex.trim(), {
          displayMode: true,
          throwOnError: false,
          errorColor: "#cc0000",
        });
        return `<div class="math-display">${html}</div>`;
      } catch (e) {
        return `<div class="math-error">Error rendering: ${latex}</div>`;
      }
    });

    // Handle inline math: $...$
    text = text.replace(/\$([^$\n]+)\$/g, (match, latex) => {
      try {
        const html = katex.renderToString(latex.trim(), {
          displayMode: false,
          throwOnError: false,
          errorColor: "#cc0000",
        });
        return `<span class="math-inline">${html}</span>`;
      } catch (e) {
        return `<span class="math-error">Error: ${latex}</span>`;
      }
    });

    // Handle LaTeX align environments
    text = text.replace(
      /\\begin\{align\}([\s\S]*?)\\end\{align\}/g,
      (match, content) => {
        try {
          const html = katex.renderToString(content.trim(), {
            displayMode: true,
            throwOnError: false,
            errorColor: "#cc0000",
          });
          return `<div class="math-block-align">
          <div class="math-block-header">Mathematical Expression</div>
          <div class="math-content">${html}</div>
        </div>`;
        } catch (e) {
          return `<div class="math-block-align">
          <div class="math-block-header">Mathematical Expression</div>
          <div class="math-error">Error rendering LaTeX: ${content}</div>
        </div>`;
        }
      },
    );

    // Handle other LaTeX environments
    const environments = ["equation", "eqnarray", "gather", "multline"];
    environments.forEach((env) => {
      const regex = new RegExp(
        `\\\\begin\\{${env}\\}([\\s\\S]*?)\\\\end\\{${env}\\}`,
        "g",
      );
      text = text.replace(regex, (match, content) => {
        try {
          const html = katex.renderToString(content.trim(), {
            displayMode: true,
            throwOnError: false,
            errorColor: "#cc0000",
          });
          return `<div class="math-display">${html}</div>`;
        } catch (e) {
          return `<div class="math-error">Error rendering ${env}: ${content}</div>`;
        }
      });
    });

    return text;
  };

  // Process mathematical terms and variables (for non-LaTeX text)
  const processMathTerms = (text: string): string => {
    // Handle mathematical terms in italics
    const mathTerms = [
      "proposed",
      "accepted",
      "executed",
      "settle",
      "acceptance",
      "synchronous",
      "limit",
      "used",
      "charged",
    ];
    mathTerms.forEach((term) => {
      const regex = new RegExp(`\\b(${term})\\b`, "gi");
      text = text.replace(regex, '<em class="math-term">$1</em>');
    });

    return text;
  };

  // Main processing pipeline
  const preprocessContent = (text: string): string => {
    // First, process LaTeX
    text = processLatex(text);

    // Finally, process mathematical terms (only on non-LaTeX content)
    text = processMathTerms(text);

    return text;
  };

  const processedContent = preprocessContent(content);
  const htmlContent = marked(processedContent);

  return (
    <div
      ref={containerRef}
      className={`
        acp-markdown-content
        ${theme === "dark" ? "markdown-body-dark" : "markdown-body"}
        max-w-none
        ${className}
      `}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

export default MarkdownRenderer;
