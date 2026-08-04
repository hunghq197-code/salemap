import { parseCmsContentBlocks } from "@/lib/cms/sanitize-content";

type CmsContentRendererProps = {
  className?: string;
  content: string;
};

export function CmsContentRenderer({
  className = "",
  content,
}: CmsContentRendererProps) {
  const blocks = parseCmsContentBlocks(content);

  return (
    <div className={["mt-8 space-y-5 text-base leading-8 text-text-primary", className].join(" ")}>
      {blocks.map((block, index) => {
        if (block.type === "h2") {
          return (
            <h2 className="pt-4 text-2xl font-bold leading-tight text-text-primary" key={`${block.type}-${index}`}>
              {block.text}
            </h2>
          );
        }

        if (block.type === "h3") {
          return (
            <h3 className="pt-2 text-xl font-bold leading-tight text-text-primary" key={`${block.type}-${index}`}>
              {block.text}
            </h3>
          );
        }

        if (block.type === "list") {
          return (
            <ul className="list-disc space-y-2 pl-6" key={`${block.type}-${index}`}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }

        return (
          <p className="whitespace-pre-wrap" key={`${block.type}-${index}`}>
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
