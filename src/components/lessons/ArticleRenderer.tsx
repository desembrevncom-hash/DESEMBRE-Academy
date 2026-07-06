import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArticleRendererProps {
  markdown: string;
}

export function ArticleRenderer({ markdown }: ArticleRendererProps) {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <ReactMarkdown
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
