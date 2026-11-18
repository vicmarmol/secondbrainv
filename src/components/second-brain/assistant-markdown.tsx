import Markdown from 'react-markdown';

export function AssistantMarkdown({ content }: { content: string }) {
 return <div className="message-text assistant-markdown"><Markdown skipHtml>{content}</Markdown></div>;
}