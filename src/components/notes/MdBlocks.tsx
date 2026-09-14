import type { MdBlock } from "@/lib/notes/types";
import { CodeBlock } from "@/components/theme/CodeBlock";
import { InteractiveCodeBlock } from "./InteractiveCodeBlock";
import { InlineMd } from "./InlineMd";

export function MdBlocks({ blocks }: { blocks: MdBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "p") {
          return (
            <p key={index}>
              <InlineMd text={block.text} />
            </p>
          );
        }
        if (block.type === "h") {
          return (
            <h4 key={index} className="md-heading">
              <InlineMd text={block.text} />
            </h4>
          );
        }
        if (block.type === "code") {
          if (block.runnable) {
            return (
              <InteractiveCodeBlock
                key={index}
                code={block.code}
                lang={block.lang}
                autoRun={block.autoRun}
              />
            );
          }
          return <CodeBlock key={index} code={block.code} lang={block.lang} />;
        }
        if (block.type === "ul") {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <InlineMd text={item} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <InlineMd text={item} />
                </li>
              ))}
            </ol>
          );
        }
        return (
          <table key={index}>
            <thead>
              <tr>
                {block.headers.map((header, headerIndex) => (
                  <th key={headerIndex}>
                    <InlineMd text={header} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>
                      <InlineMd text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      })}
    </>
  );
}
