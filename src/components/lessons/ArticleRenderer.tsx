import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArticleRendererProps {
  markdown: string;
}

export function ArticleRenderer({ markdown }: ArticleRendererProps) {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <ReactMarkdown
        skipHtml={true}
        urlTransform={(url) => {
          const lower = url.toLowerCase();
          if (
            lower.startsWith("javascript:") ||
            lower.startsWith("vbscript:") ||
            lower.startsWith("data:")
          ) {
            return "about:blank";
          }
          return url;
        }}
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => {
            const isExternal = props.href?.startsWith("http");
            return (
              <a
                {...props}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              />
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
