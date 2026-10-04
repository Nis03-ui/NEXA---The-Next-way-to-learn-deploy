"use client"

import {
  Bot,
  Check,
  Copy,
  User,
} from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type ChatMessageProps = {
  role: "user" | "assistant"
  content: string
}

export default function ChatMessage({
  role,
  content,
}: ChatMessageProps) {
  const isAssistant = role === "assistant"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className={[
        "flex w-full",
        isAssistant ? "justify-start" : "justify-end",
      ].join(" ")}
    >
      <div
        className={[
          "flex max-w-[92%] gap-3 sm:max-w-[82%]",
          isAssistant
            ? "items-start"
            : "items-end flex-row-reverse",
        ].join(" ")}
      >
        {/* Avatar */}
        <div
          className={[
            "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
            isAssistant
              ? "bg-slate-950 text-white"
              : "bg-blue-600 text-white",
          ].join(" ")}
        >
          {isAssistant ? (
            <Bot size={15} />
          ) : (
            <User size={15} />
          )}
        </div>

        {/* Message */}
        <div
          className={[
            "min-w-0 rounded-2xl px-4 py-3.5 shadow-sm",
            isAssistant
              ? "border border-slate-200 bg-white text-slate-700"
              : "bg-slate-950 text-white",
          ].join(" ")}
        >
          {isAssistant ? (
            <AssistantContent content={content} />
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-6">
              {content}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function AssistantContent({
  content,
}: {
  content: string
}) {
  return (
    <div
      className="
        max-w-none
        text-sm
        leading-6
        text-slate-700
        [&_h1]:mb-3
        [&_h1]:mt-5
        [&_h1]:text-xl
        [&_h1]:font-bold
        [&_h1]:text-slate-950
        [&_h2]:mb-2
        [&_h2]:mt-5
        [&_h2]:text-lg
        [&_h2]:font-bold
        [&_h2]:text-slate-950
        [&_h3]:mb-2
        [&_h3]:mt-4
        [&_h3]:text-base
        [&_h3]:font-bold
        [&_h3]:text-slate-950
        [&_p]:my-2
        [&_p]:leading-6
        [&_strong]:font-semibold
        [&_strong]:text-slate-950
        [&_ul]:my-3
        [&_ul]:list-disc
        [&_ul]:pl-5
        [&_ol]:my-3
        [&_ol]:list-decimal
        [&_ol]:pl-5
        [&_li]:my-1
        [&_li]:leading-6
        [&_blockquote]:my-4
        [&_blockquote]:border-l-2
        [&_blockquote]:border-blue-500
        [&_blockquote]:bg-blue-50/50
        [&_blockquote]:px-4
        [&_blockquote]:py-2
        [&_blockquote]:text-slate-600
        [&_hr]:my-5
        [&_hr]:border-slate-200
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children }) {
            const match =
              /language-(\w+)/.exec(className || "")

            return (
              <code
                className={[
                  "rounded-md bg-slate-100 px-1.5 py-0.5",
                  "font-mono text-[0.85em] font-medium",
                  "text-slate-800",
                  className || "",
                ].join(" ")}
              >
                {children}
              </code>
            )
          },

          pre({ children }) {
            const child = children as React.ReactElement<{
              className?: string
              children?: React.ReactNode
            }>

            const className = child?.props?.className || ""

            const match =
              /language-(\w+)/.exec(className)

            const code = String(
              child?.props?.children ?? "",
            ).replace(/\n$/, "")

            return (
              <CodeBlock
                language={match?.[1]}
                code={code}
              />
            )
          },

          a({ children, href }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="
                  font-medium
                  text-blue-600
                  underline
                  underline-offset-2
                  hover:text-blue-700
                "
              >
                {children}
              </a>
            )
          },

          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[500px] border-collapse text-xs">
                  {children}
                </table>
              </div>
            )
          },

          th({ children }) {
            return (
              <th className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">
                {children}
              </th>
            )
          },

          td({ children }) {
            return (
              <td className="border-b border-slate-100 px-3 py-2 text-slate-600">
                {children}
              </td>
            )
          },

          blockquote({ children }) {
            return (
              <blockquote>
                {children}
              </blockquote>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function CodeBlock({
  language,
  code,
}: {
  language?: string
  code: string
}) {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {language || "code"}
        </span>

        <button
          type="button"
          onClick={copyCode}
          className="
            inline-flex
            min-h-8
            items-center
            gap-1.5
            rounded-lg
            px-2
            py-1
            text-[10px]
            font-semibold
            text-slate-400
            transition
            hover:bg-white/10
            hover:text-white
          "
        >
          {copied ? (
            <>
              <Check size={12} />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>

      <pre className="overflow-x-auto p-4 text-xs leading-6 text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  )
}